import React from 'react';
import { useStore } from '@/store/useStore';
import { PrivacySettings as PrivacySettingsType } from '@/types';
import { Shield } from 'lucide-react';

export const PrivacySettings: React.FC = () => {
  const { privacySettings, setPrivacySettings } = useStore();

  const toggleSetting = (key: keyof PrivacySettingsType) => {
    setPrivacySettings({ [key]: !privacySettings[key] });
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
      </div>
      
      <p className="text-gray-600 mb-6">
        Choose which types of media you want to track. Only enabled types will be monitored and can earn NFTs.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Movies</label>
            <p className="text-sm text-gray-600">Track when you watch movies</p>
          </div>
          <Toggle
            enabled={privacySettings.trackMovies}
            onChange={() => toggleSetting('trackMovies')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Anime</label>
            <p className="text-sm text-gray-600">Track when you watch anime</p>
          </div>
          <Toggle
            enabled={privacySettings.trackAnime}
            onChange={() => toggleSetting('trackAnime')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Shows</label>
            <p className="text-sm text-gray-600">Track when you watch TV shows</p>
          </div>
          <Toggle
            enabled={privacySettings.trackShows}
            onChange={() => toggleSetting('trackShows')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Books</label>
            <p className="text-sm text-gray-600">Track when you read books</p>
          </div>
          <Toggle
            enabled={privacySettings.trackBooks}
            onChange={() => toggleSetting('trackBooks')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Manga</label>
            <p className="text-sm text-gray-600">Track when you read manga</p>
          </div>
          <Toggle
            enabled={privacySettings.trackManga}
            onChange={() => toggleSetting('trackManga')}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-secondary-dark rounded-lg">
          <div>
            <label className="font-semibold text-gray-900">Comics</label>
            <p className="text-sm text-gray-600">Track when you read comics</p>
          </div>
          <Toggle
            enabled={privacySettings.trackComics}
            onChange={() => toggleSetting('trackComics')}
          />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div>
              <label className="font-semibold text-gray-900">Auto-mint NFTs</label>
              <p className="text-sm text-gray-600">Automatically mint NFTs when you complete media</p>
            </div>
            <Toggle
              enabled={privacySettings.autoMint}
              onChange={() => toggleSetting('autoMint')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};
