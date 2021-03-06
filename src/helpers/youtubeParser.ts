/// Youtube filter, adapted from web-scrobbler/web-scrobbler and web-scrobbler/metadata-filter
import { Pool } from "mysql2/promise";
import { MoreVideoDetails } from "ytdl-core";
import fetchAlbum from "./albumFetcher";

interface FilterRule {
	/**
	 * String or pattern to replace.
	 */
	source: RegExp | string;

	/**
	 * Replacement string.
	 */
	target: string;
}

const ytDescFirstLine = "Provided to YouTube";
const ytDescLastLine = "Auto-generated by YouTube.";
const ytDescSeparator = " · ";
const artistSeparator = ", ";
const ytTitleRegExps = [
	// Artist「Track」 (Japanese tracks)
	{
		pattern: /(.+?)[『｢「](.+?)[」｣』]/,
		groups: { artist: 1, track: 2 },
	},
	// 「Track」Artist (Japanese tracks but opposite ordered)
	{
		pattern: /[『｢「](.+?)[」｣』](.+)/,
		groups: { artist: 2, track: 1 },
	},
	// Artist "Track", Artist: "Track", Artist - "Track", etc.
	{
		pattern: /(.+?)([\s:—-])+\s*"(.+?)"/,
		groups: { artist: 1, track: 3 },
	},
	// Track (... by Artist)
	{
		pattern: /(\w[\s\w]*?)\s+\([^)]*\s*by\s*([^)]+)+\)/,
		groups: { artist: 2, track: 1 },
	},
];
const separators = /(?: -- )|(?:--)|(?: ~ )|(?: \u002d )|(?: \u2013 )|(?: \u2014 )|(?: \/\/ )|(?:\u002d)|(?:\u2013)|(?:\u2014)|(?::)|(?:\|)|(?:\/\/\/)|(?:\/)|(?:~)/;
const YOUTUBE_TRACK_FILTER_RULES: FilterRule[] = [
	// Trim whitespaces
	{ source: /^\s+|\s+$/g, target: '' },
	// **NEW**
	{ source: /\*+\s?\S+\s?\*+$/, target: '' },
	// [Whatever]
	{ source: /\[[^\]]+\]/, target: '' },
	// 【Whatever】
	{ source: /【[^\]]+】/, target: '' },
	// （Whatever）
	{ source: /（[^\]]+）/, target: '' },
	// (Whatever Version)
	{ source: /\([^)]*version\)$/i, target: '' },
	// Video extensions
	{ source: /\.(avi|wmv|mpg|mpeg|flv)$/i, target: '' },
	// (Lyrics Video)
	{ source: /\(.*lyrics?\s*(video)?\)/i, target: '' },
	// ((Official)? (Track)? Stream)
	{ source: /\((of+icial\s*)?(track\s*)?stream\)/i, target: '' },
	// ((Official)? (Music)? Video|Audio)
	{ source: /\((of+icial\s*)?(music\s*)?(video|audio)\)/i, target: '' },
	// - (Official)? (Music)? Video|Audio
	{ source: /-\s(of+icial\s*)?(music\s*)?(video|audio)$/i, target: '' },
	// ((Whatever)? Album Track)
	{ source: /\(.*Album\sTrack\)/i, target: '' },
	// (Official)
	{ source: /\(\s*of+icial\s*\)/i, target: '' },
	// (1999)
	{ source: /\(\s*[0-9]{4}\s*\)/i, target: '' },
	// (HD) / (HQ)
	{ source: /\(\s*(HD|HQ)\s*\)$/, target: '' },
	// HD / HQ
	{ source: /(HD|HQ)\s?$/, target: '' },
	// Video Clip Officiel / Video Clip Official
	{ source: /(vid[\u00E9e]o)?\s?clip\sof+ici[ae]l/i, target: '' },
	// Offizielles
	{ source: /of+iziel+es\s*video/i, target: '' },
	// Video Clip
	{ source: /vid[\u00E9e]o\s?clip/i, target: '' },
	// Clip
	{ source: /\sclip/i, target: '' },
	// Full Album
	{ source: /full\s*album/i, target: '' },
	// (Live)
	{ source: /\(live.*?\)$/i, target: '' },
	// | Something
	{ source: /\|.*$/i, target: '' },
	// Artist - The new "Track title" featuring someone
	{ source: /^(|.*\s)"(.{5,})"(\s.*|)$/, target: '$2' },
	// 'Track title'
	{ source: /^(|.*\s)'(.{5,})'(\s.*|)$/, target: '$2' },
	// (*01/01/1999*)
	{ source: /\(.*[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}.*\)/i, target: '' },
	// Sub Español
	{ source: /sub\s*español/i, target: '' },
	// (Letra)
	{ source: /\s\(Letra\)/i, target: '' },
	// (En vivo)
	{ source: /\s\(En\svivo\)/i, target: '' },
	// Sub Español
	{ source: /sub\s*español/i, target: '' },
];

export default class YoutubeParser {

	videoDetails:MoreVideoDetails;
	pool:Pool;

	constructor(videoDetails:MoreVideoDetails, pool:Pool) {
		this.videoDetails = videoDetails;
		this.pool = pool;
	}

	getVideoDescription() {
		return this.videoDetails.description;
	}

	getTrackInfoFromDescription() {
		const description = this.getVideoDescription();
		if (typeof description !== "string") {
			return {artist: null, album: null, track: null};
		}

		return this.parseYtVideoDescription(description);

	}

	isYtVideoDescriptionValid(desc:string) {
		return (
			desc &&
			(desc.startsWith(ytDescFirstLine) ||
				desc.endsWith(ytDescLastLine))
		);
	}

	parseYtVideoDescription(desc:string) {
		if (!this.isYtVideoDescriptionValid(desc)) {
			return {artist: null, album: null, track: null};
		}

		const lines = desc
			.split('\n')
			.filter((line) => {
				return line.length > 0;
			})
			.filter((line) => {
				return !line.startsWith(ytDescFirstLine);
			});

		const firstLine = lines[0];
		const secondLine = lines[1];

		const trackInfo = firstLine.split(ytDescSeparator);
		const numberOfFields = trackInfo.length;

		const album = secondLine;
		let artist = null;
		let track = null;
		let featArtists = null;

		if (numberOfFields < 2) {
			[track] = trackInfo;
		} else if (numberOfFields === 2) {
			[track, artist] = trackInfo;
		} else {
			[track, artist, ...featArtists] = trackInfo;

			const areFeatArtistPresent = featArtists.some((artist) =>
				track.includes(artist)
			);
			if (!areFeatArtistPresent) {
				const featArtistsStr = featArtists.join(artistSeparator);
				track = `${track} (feat. ${featArtistsStr})`;
			}
		}

		return { artist, track, album };
	}

	isArtistTrackEmpty(artistTrack:{artist:string, track:string}) {
		return !(artistTrack && artistTrack.artist && artistTrack.track);
	}

	processYtVideoTitle(videoTitle:string) {
		let artist = null;
		let track = null;

		if (!videoTitle) {
			return { artist, track };
		}

		// Remove [genre] or 【genre】 from the beginning of the title
		let title = videoTitle.replace(
			/^((\[[^\]]+])|(【[^】]+】))\s*-*\s*/i,
			''
		);

		// Remove track (CD and vinyl) numbers from the beginning of the title
		title = title.replace(/^\s*([a-zA-Z]{1,2}|[0-9]{1,2})[1-9]?\.\s+/i, '');

		// Remove - and / preceding opening bracket
		title = title.replace(/[-/]\s*([「【『])/, '$1');

		// Remove - and / succeeding closing bracket
		title = title.replace(/([」】』])\s*[-/]/, '$1');

		// 【/(*Music Video/MV/PV*】/)
		title = title.replace(/[(【].*?((MV)|(PV)).*?[】)]/i, '');

		// 【/(東方/オリジナル*】/)
		title = title.replace(/[(【]((オリジナル)|(東方)).*?[】)]/, '');

		// MV/PV if not followed by an opening/closing bracket or if ending
		title = title.replace(/(MV|PV)([「【『』】」]|$)/i, '$2');

		// Try to match one of the regexps
		for (const regExp of ytTitleRegExps) {
			const artistTrack = title.match(regExp.pattern);
			if (artistTrack) {
				artist = artistTrack[regExp.groups.artist];
				track = artistTrack[regExp.groups.track];
				break;
			}
		}

		// No match? Try splitting, then.
		if (this.isArtistTrackEmpty({ artist, track })) {
			[artist, track] = title.split(separators, 2);
		}

		// No match? Check for 【】
		if (this.isArtistTrackEmpty({ artist, track })) {
			const artistTrack = title.match(/(.+?)【(.+?)】/);
			if (artistTrack) {
				artist = artistTrack[1];
				track = artistTrack[2];
			}
		}

		if (this.isArtistTrackEmpty({ artist, track })) {
			track = title;
		}

		return { artist, track };
	}

	filterTrack(track:string) {
		for (let regex of YOUTUBE_TRACK_FILTER_RULES) {
			track.replace(regex.source, regex.target);
		}
		return track;
	}

	getTrackInfoFromTitle() {
		let { artist, track } = this.processYtVideoTitle(this.videoDetails.title);
		if (!artist) {
			artist = this.videoDetails.author.name;
		}
	
		return { artist: artist.trim(), track: this.filterTrack(track) };
	}

	async getTags() {
		let {artist, track, album} = this.getTrackInfoFromDescription();
		if (artist === null) {
			let {artist, track} = this.getTrackInfoFromTitle();
			let album = await fetchAlbum(artist, track, this.pool).catch(err => console.log(err));
			return {artist, album, track};
		}
		return {artist, album, track};
	}

}