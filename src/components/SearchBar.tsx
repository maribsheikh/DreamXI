import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: number;
  name: string;
  team: string;  // This maps to 'squad' in the backend
  position: string;
  nation: string;  // Changed from nationality to nation to match backend
}

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchPlayers = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/api/players/search/?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('Search request failed');
        }
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error searching players:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchPlayers, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handlePlayerClick = (playerId: number) => {
    navigate(`/player-stats/${playerId}`);
    setShowResults(false);
    setQuery('');
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          type="search"
          placeholder="Search players..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          className="w-64 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
      </div>

      {showResults && (query.length >= 2) && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          {isLoading ? (
            <div className="p-4 text-gray-400 text-center">Loading...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((player) => (
                <li
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-medium">{player.name}</span>
                    <span className="text-gray-400 text-sm">
                      {player.team} • {player.position} • {player.nation}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-gray-400 text-center">No players found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar; 