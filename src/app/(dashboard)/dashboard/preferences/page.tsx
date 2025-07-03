import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreferencesForm } from '@/features/preferences/components/preferences-form'
import { getUserPreferences, getDistrictOptions, getApartmentTypeOptions } from '@/features/preferences/actions'

export default async function PreferencesPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    redirect('/login')
  }

  // Get existing preferences
  const { preferences } = await getUserPreferences(user.id)
  
  // Get options for dropdowns
  const districts = await getDistrictOptions()
  const propertyTypes = await getApartmentTypeOptions()

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Search Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Set up your ideal apartment criteria and we'll notify you when matches are found
        </p>
      </div>

      <PreferencesForm 
        userId={user.id}
        initialData={preferences}
        districts={districts}
        propertyTypes={propertyTypes}
      />
    </div>
  )
}