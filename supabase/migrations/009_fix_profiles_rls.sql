-- Fix profiles table RLS to allow user creation during signup
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create a more permissive insert policy that works with auth triggers
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also ensure the auth trigger exists to create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;