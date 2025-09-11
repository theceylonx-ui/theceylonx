#!/usr/bin/env node

// Script to add missing site settings to the database
import { storage } from '../server/storage.js';

const defaultSiteSettings = [
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
    key: 'support_enabled',
    value: 'true',
    description: 'Whether customer support features are enabled',
    category: 'features'
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
  },
  {
    key: 'welcome_message',
    value: 'Welcome to Ceylon Expand - your gateway to unforgettable Sri Lankan adventures!',
    description: 'Welcome message for new users',
    category: 'content'
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
  }
];

async function addSiteSettings() {
  console.log('🚀 Adding default site settings...');
  
  try {
    for (const setting of defaultSiteSettings) {
      try {
        const result = await storage.setSiteSetting(
          setting.key,
          setting.value,
          setting.description,
          setting.category
        );
        console.log(`✅ Added setting: ${setting.key} = ${setting.value}`);
      } catch (error) {
        console.error(`❌ Failed to add setting ${setting.key}:`, error.message);
      }
    }
    
    console.log('\n🎉 Site settings setup completed!');
    
    // Verify the settings were added
    console.log('\n🔍 Verifying settings...');
    for (const setting of defaultSiteSettings) {
      try {
        const result = await storage.getSiteSetting(setting.key);
        if (result) {
          console.log(`✅ ${setting.key}: ${result.value}`);
        } else {
          console.log(`❌ ${setting.key}: NOT FOUND`);
        }
      } catch (error) {
        console.error(`❌ Error verifying ${setting.key}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to add site settings:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addSiteSettings().then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export { addSiteSettings, defaultSiteSettings };