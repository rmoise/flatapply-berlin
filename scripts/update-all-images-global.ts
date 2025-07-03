import dotenv from 'dotenv';
import { getGlobalImageService } from '../src/features/scraping/services/global-image-service';

dotenv.config({ path: '.env.local' });

async function updateAllImagesGlobal() {
  console.log('🚀 Starting global image update...\n');
  
  const imageService = getGlobalImageService();
  
  try {
    await imageService.initialize();
    
    // Step 1: Process listings without images
    console.log('📸 Step 1: Processing listings without images...\n');
    const newResults = await imageService.processListingsWithoutImages(100);
    
    const successCount = newResults.filter(r => r.success).length;
    console.log(`\n✅ Added images to ${successCount}/${newResults.length} listings`);
    
    // Step 2: Fix broken images
    console.log('\n📸 Step 2: Checking and fixing broken images...\n');
    await imageService.fixBrokenImages();
    
    // Summary
    console.log('\n📊 Update complete!');
    console.log('Next steps:');
    console.log('- Run this script periodically (e.g., daily)');
    console.log('- Monitor for new listings without images');
    console.log('- Check for broken images regularly');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await imageService.close();
  }
}

// Run if called directly
if (require.main === module) {
  updateAllImagesGlobal().catch(console.error);
}

export { updateAllImagesGlobal };