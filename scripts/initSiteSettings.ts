/**
 * Initialize site settings in the database
 * This script adds essential site settings that the frontend expects
 */

import { storage } from "../server/storage";

interface SiteSetting {
  key: string;
  value: string;
  description: string;
  category: string;
}

const defaultSiteSettings: SiteSetting[] = [
  {
    key: 'landing_background_image',
    value: '/assets/generated_images/Sri_Lanka_beach_scene_60ca99d3.png',
    description: 'Background image for the landing page',
    category: 'ui'
  },
  {
    key: 'site_logo',
    value: '/assets/logo.png',
    description: 'Main site logo image',
    category: 'branding'
  },
  {
    key: 'site_name',
    value: 'Ceylon Expand',
    description: 'Display name of the site',
    category: 'branding'
  },
  {
    key: 'site_tagline',
    value: 'Discover Sri Lanka with Like-minded Travelers',
    description: 'Main tagline for the site',
    category: 'branding'
  },
  {
    key: 'contact_email',
    value: 'hello@theceylonx.com',
    description: 'Main contact email for the site',
    category: 'contact'
  },
  {
    key: 'hero_title',
    value: 'Explore Sri Lanka Together',
    description: 'Main hero title on landing page',
    category: 'content'
  },
  {
    key: 'hero_subtitle',
    value: 'Join fellow travelers, discover hidden gems, and create lasting memories in the Pearl of the Indian Ocean.',
    description: 'Hero subtitle on landing page',
    category: 'content'
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    description: 'Whether the site is in maintenance mode',
    category: 'system'
  },
  {
    key: 'max_trip_participants',
    value: '20',
    description: 'Maximum number of participants allowed per trip',
    category: 'limits'
  }
];

async function initializeSiteSettings(): Promise<void> {
  console.log('🚀 Initializing site settings...');
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    for (const setting of defaultSiteSettings) {
      try {
        // Check if setting already exists
        const existing = await storage.getSiteSetting(setting.key);
        
        if (existing) {
          console.log(`ℹ️  Setting already exists: ${setting.key} = ${existing.value}`);
          continue;
        }
        
        // Create the setting
        const result = await storage.setSiteSetting(
          setting.key,
          setting.value,
          setting.description,
          setting.category
        );
        
        console.log(`✅ Added setting: ${setting.key} = ${setting.value}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Failed to add setting ${setting.key}:`, error instanceof Error ? error.message : String(error));
        errorCount++;
      }
    }
    
    console.log(`\n🎉 Site settings initialization completed!`);
    console.log(`✅ Successfully added: ${successCount} settings`);
    if (errorCount > 0) {
      console.log(`❌ Failed to add: ${errorCount} settings`);
    }
    
    // Verify critical settings
    console.log('\n🔍 Verifying critical settings...');
    const criticalSettings = ['landing_background_image', 'site_name', 'hero_title'];
    
    for (const key of criticalSettings) {
      try {
        const result = await storage.getSiteSetting(key);
        if (result) {
          console.log(`✅ ${key}: ${result.value}`);
        } else {
          console.log(`❌ ${key}: NOT FOUND`);
        }
      } catch (error) {
        console.error(`❌ Error verifying ${key}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
  } catch (error) {
    console.error('💥 Failed to initialize site settings:', error);
    throw error;
  }
}

// Export for use in other scripts
export { initializeSiteSettings, defaultSiteSettings };

// Run if called directly
if (require.main === module) {
  initializeSiteSettings()
    .then(() => {
      console.log('\n✨ Site settings initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Initialization failed:', error);
      process.exit(1);
    });
}