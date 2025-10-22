// Image service for fetching player images

// Cache helpers with TTL
const CACHE_TTL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const cacheKey = (name: string) => `player_img_${name.toLowerCase()}`;
interface CachedImageEntry { url: string; ts: number; }
function readCache(name: string): string | null {
	try {
		const raw = localStorage.getItem(cacheKey(name));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CachedImageEntry;
		if (!parsed?.url || !parsed?.ts) return null;
		if (Date.now() - parsed.ts > CACHE_TTL_DAYS * MS_PER_DAY) return null;
		return parsed.url;
	} catch (_) { return null; }
}
function writeCache(name: string, url: string): void {
	try { localStorage.setItem(cacheKey(name), JSON.stringify({ url, ts: Date.now() } as CachedImageEntry)); } catch (_) {}
}

// Try Wikipedia REST summary for a given title
async function fetchWikipediaSummaryImage(title: string): Promise<string | null> {
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`;
	const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
	if (!res.ok) return null;
	const data = await res.json();
	if (data && data.thumbnail && data.thumbnail.source) {
		return data.thumbnail.source as string;
	}
	return null;
}

// Wikipedia search -> pageimages thumbnail
async function fetchWikipediaSearchImage(query: string): Promise<string | null> {
	const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
	const searchRes = await fetch(searchUrl);
	if (!searchRes.ok) return null;
	const searchData = await searchRes.json();
	const first = searchData?.query?.search?.[0];
	const title: string | undefined = first?.title;
	if (!title) return null;
	// Try summary first (often higher quality thumb)
	const fromSummary = await fetchWikipediaSummaryImage(title);
	if (fromSummary) return fromSummary;
	// Fallback to pageimages
	const pageImgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=600&format=json&origin=*`;
	const pageRes = await fetch(pageImgUrl);
	if (!pageRes.ok) return null;
	const pageData = await pageRes.json();
	const pages = pageData?.query?.pages;
	if (!pages) return null;
	const page = Object.values(pages)[0] as any;
	return page?.thumbnail?.source ?? null;
}

// Wikidata P18 image via wikibase_item
async function fetchWikidataP18ImageFromTitle(title: string): Promise<string | null> {
	// Get wikibase item id from enwiki page
	const propsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageprops&format=json&origin=*`;
	const propsRes = await fetch(propsUrl);
	if (!propsRes.ok) return null;
	const propsData = await propsRes.json();
	const pages = propsData?.query?.pages;
	if (!pages) return null;
	const page: any = Object.values(pages)[0];
	const qid: string | undefined = page?.pageprops?.wikibase_item;
	if (!qid) return null;
	// Fetch entity for P18
	const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
	const entityRes = await fetch(entityUrl);
	if (!entityRes.ok) return null;
	const entityData = await entityRes.json();
	const ent = entityData?.entities?.[qid];
	const p18 = ent?.claims?.P18?.[0]?.mainsnak?.datavalue?.value as string | undefined; // filename
	if (!p18) return null;
	// Build a commons file path thumb
	// Spaces are allowed; Special:FilePath handles it
	return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(p18)}?width=600`;
}

// Build candidate Wikipedia titles to try
function buildCandidateTitles(name: string, team?: string, nation?: string): string[] {
	const candidates = new Set<string>();
	const trimmedName = name.trim();
	candidates.add(trimmedName);
	candidates.add(`${trimmedName} (footballer)`);
	candidates.add(`${trimmedName} (soccer)`);
	candidates.add(`${trimmedName} footballer`);
	if (team) {
		candidates.add(`${trimmedName} (${team})`);
		candidates.add(`${trimmedName} ${team} footballer`);
	}
	if (nation) {
		candidates.add(`${trimmedName} (${nation} footballer)`);
		candidates.add(`${trimmedName} ${nation} footballer`);
	}
	return Array.from(candidates);
}

export const getPlayerImage = async (playerName: string, teamName?: string, nation?: string): Promise<string> => {
	// Check cache first
	const cached = readCache(playerName);
	if (cached) return cached;

	// Try multiple Wikipedia title strategies (summary first)
	const titles = buildCandidateTitles(playerName, teamName, nation);
	for (const title of titles) {
		try {
			const img = await fetchWikipediaSummaryImage(title);
			if (img) { writeCache(playerName, img); return img; }
		} catch (_) {}
	}

	// Try Wikipedia search based on name + team/nation
	const compositeQueries: string[] = [];
	compositeQueries.push(playerName);
	if (teamName) compositeQueries.push(`${playerName} ${teamName}`);
	if (nation) compositeQueries.push(`${playerName} ${nation} footballer`);
	for (const q of compositeQueries) {
		try {
			const img = await fetchWikipediaSearchImage(q);
			if (img) { writeCache(playerName, img); return img; }
		} catch (_) {}
	}

	// Try Wikidata P18 via each candidate title
	for (const title of titles) {
		try {
			const img = await fetchWikidataP18ImageFromTitle(title);
			if (img) { writeCache(playerName, img); return img; }
		} catch (_) {}
	}

	// Fallback avatar if nothing found
	const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=400&background=1e293b&color=60a5fa&bold=true&format=png&font-size=0.5`;
	writeCache(playerName, fallback);
	return fallback;
};

// Position-based image styling
export const getPositionBasedImage = (playerName: string, position: string): string => {
	const pos = position.toLowerCase();
	let backgroundColor = '1e293b';
	let textColor = '60a5fa';
	
	if (pos.includes('goalkeeper')) {
		backgroundColor = 'dc2626'; // Red
		textColor = 'ffffff';
	} else if (pos.includes('defender')) {
		backgroundColor = '2563eb'; // Blue
		textColor = 'ffffff';
	} else if (pos.includes('midfielder')) {
		backgroundColor = '16a34a'; // Green
		textColor = 'ffffff';
	} else if (pos.includes('forward') || pos.includes('striker')) {
		backgroundColor = 'f59e0b'; // Yellow
		textColor = '000000';
	}
	
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=400&background=${backgroundColor}&color=${textColor}&bold=true&format=png&font-size=0.5`;
};

// Team-based image styling
export const getTeamBasedImage = (playerName: string, teamName: string): string => {
	const teamColors: { [key: string]: { bg: string; color: string } } = {
		'manchester united': { bg: 'dc2626', color: 'ffffff' },
		'manchester city': { bg: '0ea5e9', color: 'ffffff' },
		'liverpool': { bg: 'dc2626', color: 'ffffff' },
		'chelsea': { bg: '1e40af', color: 'ffffff' },
		'arsenal': { bg: 'dc2626', color: 'ffffff' },
		'tottenham': { bg: '1e293b', color: 'ffffff' },
		'real madrid': { bg: '1e40af', color: 'ffffff' },
		'barcelona': { bg: 'dc2626', color: 'ffffff' },
		'bayern munich': { bg: 'dc2626', color: 'ffffff' },
		'psg': { bg: '1e40af', color: 'ffffff' },
	};
	
	const teamKey = teamName.toLowerCase();
	const colors = teamColors[teamKey] || { bg: '1e293b', color: '60a5fa' };
	
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&size=400&background=${colors.bg}&color=${colors.color}&bold=true&format=png&font-size=0.5`;
};

