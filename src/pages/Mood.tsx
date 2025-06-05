import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MoodEntry {
  id: string;
  mood: string;
  intensity: number;
  note: string;
  activities: string[];
  date: string;
}

const Mood: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [intensity, setIntensity] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [moodEntries, setMoodEntries] = useLocalStorage<MoodEntry[]>('dopamind_moods', []);
  const [showForm, setShowForm] = useState(false);

  const moods = [
    { emoji: '😕', label: 'Sad', color: 'bg-orange-100' },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100' },
    { emoji: '😊', label: 'Happy', color: 'bg-yellow-100' },
    { emoji: '😄', label: 'Great', color: 'bg-green-100', selected: true },
    { emoji: '🤩', label: 'Amazing', color: 'bg-blue-100' },
  ];

  const activities = [
    'Exercise', 'Work', 'Reading', 'Social', 
    'Sleep', 'Meditation', 'Hobbies', 'Travel'
  ];

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = () => {
    if (!selectedMood) return;

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      mood: selectedMood,
      intensity,
      note,
      activities: selectedActivities,
      date: new Date().toISOString()
    };

    setMoodEntries(prev => [newEntry, ...prev]);
    
    // Update stats
    const stats = JSON.parse(localStorage.getItem('dopamind_stats') || '{"totalFocusMinutes": 0, "currentStreak": 0, "moodEntries": 0}');
    stats.moodEntries += 1;
    localStorage.setItem('dopamind_stats', JSON.stringify(stats));

    // Reset form
    setSelectedMood('');
    setIntensity(3);
    setNote('');
    setSelectedActivities([]);
    setShowForm(false);
  };

  const getMoodSuggestion = () => {
    const recentEntries = moodEntries.slice(0, 3);
    const negativeMoods = recentEntries.filter(entry => ['Sad', 'Neutral'].includes(entry.mood));
    
    if (negativeMoods.length >= 2) {
      return "Consider taking a short walk or doing a breathing exercise. Small actions can make a big difference! 🌱";
    }
    return "You're doing great! Keep up with your positive habits. 🌟";
  };

  const getMoodCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const calendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(today.getFullYear(), today.getMonth(), day).toDateString();
      const dayEntries = moodEntries.filter(entry => 
        new Date(entry.date).toDateString() === dateStr
      );
      
      let dayMood = '';
      if (dayEntries.length > 0) {
        dayMood = moods.find(m => m.label === dayEntries[0].mood)?.emoji || '';
      }

      calendar.push({
        day,
        mood: dayMood,
        hasEntry: dayEntries.length > 0
      });
    }

    return calendar;
  };

  return (
    <div className="min-h-screen bg-navy-blue pb-20">
      {/* Header */}
      <div className="bg-navy-blue px-4 py-6 shadow-sm">
        <div className="max-w-md mx-auto flex items-center">
          <button className="text-white text-xl mr-4">←</button>
          <h1 className="text-xl font-bold text-white text-center flex-1">Mood Tracker</h1>
        </div>
      </div>

      <div className="px-4 pt-6">
        <div className="max-w-md mx-auto">
          {showForm ? (
            <div className="dopamind-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-dark">How are you feeling?</h2>
                <Button 
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  size="sm"
                  className="text-text-light border-gray-200"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between gap-3">
                    {moods.map((mood, index) => (
                      <button
                        key={mood.label}
                        onClick={() => setSelectedMood(mood.label)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all ${
                          selectedMood === mood.label || (selectedMood === '' && mood.selected)
                            ? 'bg-teal-primary ring-2 ring-teal-primary ring-offset-2' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block text-text-dark">
                    Intensity
                  </Label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, #38b2ac 0%, #38b2ac ${(intensity - 1) * 25}%, #e2e8f0 ${(intensity - 1) * 25}%, #e2e8f0 100%)`
                      }}
                    />
                    <div 
                      className="absolute top-1/2 w-6 h-6 bg-navy-blue rounded-full transform -translate-y-1/2 -translate-x-3 pointer-events-none"
                      style={{ left: `${(intensity - 1) * 25}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="note" className="text-base font-semibold mb-3 block text-text-dark">
                    Notes
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder=""
                    rows={3}
                    className="border-gray-300 focus:border-teal-primary focus:ring-teal-primary/20 rounded-xl bg-gray-50"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold mb-3 block text-text-dark">
                    Activity
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {activities.slice(0, 3).map((activity) => (
                      <button
                        key={activity}
                        onClick={() => handleActivityToggle(activity)}
                        className={`px-4 py-2 text-sm rounded-full transition-colors ${
                          selectedActivities.includes(activity)
                            ? 'bg-button-teal text-white'
                            : activity === 'Exercise' 
                              ? 'bg-button-teal text-white'
                              : 'bg-gray-200 text-text-dark hover:bg-gray-300'
                        }`}
                      >
                        {activity}
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedMood}
                  className="w-full bg-button-teal hover:bg-teal-primary text-white h-12 rounded-xl font-semibold"
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="dopamind-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-text-dark mb-4 text-center">Track Your Mood</h2>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-button-teal hover:bg-teal-primary text-white w-full h-12 rounded-xl font-semibold"
                >
                  How are you feeling?
                </Button>
              </div>

              <div className="dopamind-card p-6 mb-6">
                <h3 className="font-semibold text-text-dark mb-4">This Month</h3>
                <div className="grid grid-cols-7 gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-center text-xs text-text-light font-medium p-2">
                      {day}
                    </div>
                  ))}
                  {getMoodCalendar().map(({ day, mood, hasEntry }) => (
                    <div 
                      key={day} 
                      className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                        hasEntry ? 'bg-teal-primary/20' : 'bg-gray-50'
                      }`}
                    >
                      {mood ? (
                        <span className="text-lg">{mood}</span>
                      ) : (
                        <span className="text-gray-400">{day}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="dopamind-card p-6 mb-6">
                <h3 className="font-semibold text-text-dark mb-4">Wellness Suggestion</h3>
                <p className="text-text-light">{getMoodSuggestion()}</p>
              </div>

              <div className="dopamind-card p-4">
                <h3 className="font-semibold text-text-dark mb-3">Recent Entries</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {moodEntries.slice(0, 10).map((entry) => {
                    const moodData = moods.find(m => m.label === entry.mood);
                    return (
                      <div key={entry.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{moodData?.emoji}</span>
                            <span className="font-medium text-text-dark">{entry.mood}</span>
                          </div>
                          <span className="text-xs text-text-light">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-text-light mb-1">{entry.note}</p>
                        )}
                        {entry.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.activities.map((activity, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {activity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {moodEntries.length === 0 && (
                    <div className="text-center text-text-light py-4">
                      No mood entries yet. Start tracking your mood!
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-blue px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <div className="flex flex-col items-center">
            <div className="text-white text-xl mb-1">🏠</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-white text-xl mb-1">📊</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-orange-accent rounded-full flex items-center justify-center text-white text-xl">+</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-white text-xl mb-1">🔔</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-white text-xl mb-1">👤</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mood;
