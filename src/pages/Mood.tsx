
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLocalStorage } from '../hooks/useLocalStorage';
import BottomNav from '../components/BottomNav';

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
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimer, setScrollTimer] = useState<NodeJS.Timeout | null>(null);

  const moods = [
    { emoji: '😡', label: 'Angry', color: 'bg-red-100' },
    { emoji: '😞', label: 'Sad', color: 'bg-blue-100' },
    { emoji: '😐', label: 'Neutral', color: 'bg-gray-100' },
    { emoji: '😊', label: 'Happy', color: 'bg-mint-green/20', selected: true },
    { emoji: '😄', label: 'Great', color: 'bg-green-100' },
  ];

  const activities = [
    'Exercise', 'Work', 'Reading', 'Social', 
    'Sleep', 'Meditation', 'Hobbies', 'Travel'
  ];

  // Handle scroll for bottom nav auto-hide
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      
      const newTimer = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
      
      setScrollTimer(newTimer);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
    };
  }, [scrollTimer]);

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
    const negativeMoods = recentEntries.filter(entry => ['Sad', 'Neutral', 'Angry'].includes(entry.mood));
    
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
    <div className="min-h-screen bg-light-gray pb-20">
      {/* Header */}
      <div className="bg-deep-blue px-4 py-6 shadow-sm">
        <div className="max-w-md mx-auto flex items-center">
          <h1 className="text-xl font-bold text-pure-white text-center flex-1">Mood Tracker</h1>
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
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all border-2 ${
                          selectedMood === mood.label || (selectedMood === '' && mood.selected)
                            ? 'bg-mint-green border-mint-green shadow-lg transform scale-110' 
                            : 'bg-white border-gray-200 hover:border-mint-green'
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
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #10B981 0%, #10B981 ${(intensity - 1) * 25}%, #e5e7eb ${(intensity - 1) * 25}%, #e5e7eb 100%)`
                      }}
                    />
                    <div 
                      className="absolute top-1/2 w-6 h-6 bg-mint-green rounded-full transform -translate-y-1/2 -translate-x-3 pointer-events-none border-2 border-white shadow-lg"
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
                    placeholder="Describe your feelings or what influenced your mood"
                    rows={3}
                    className="border-gray-300 focus:border-mint-green focus:ring-mint-green/20 rounded-xl bg-white text-deep-blue"
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
                            ? 'bg-mint-green text-white'
                            : activity === 'Exercise' 
                              ? 'bg-mint-green text-white'
                              : 'bg-light-gray text-text-dark hover:bg-gray-300 border border-gray-200'
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
                  className="w-full bg-mint-green hover:bg-mint-green/90 text-white h-12 rounded-xl font-semibold"
                >
                  Submit
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="dopamind-card p-6 mb-6">
                <h2 className="text-lg font-semibold text-text-dark mb-4 text-center">How are you feeling today?</h2>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-mint-green hover:bg-mint-green/90 text-white w-full h-12 rounded-xl font-semibold"
                >
                  Track Your Mood
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
                        hasEntry ? 'bg-mint-green/20' : 'bg-light-gray'
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
                              <span key={idx} className="text-xs bg-light-gray px-2 py-1 rounded border">
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

      {/* Bottom Navigation with auto-hide */}
      <div className={`${isScrolling ? 'hide-nav' : 'show-nav'}`}>
        <BottomNav />
      </div>
    </div>
  );
};

export default Mood;
