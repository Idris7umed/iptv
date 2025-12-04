// IPTV Browser Application
const MAX_VISIBLE_CHANNELS = 100;
const SAVED_CHANNELS_KEY = 'hala_iptv_saved_channels';
const THEME_KEY = 'hala_iptv_theme';

class IPTVBrowser {
    constructor() {
        this.channels = [];
        this.filteredChannels = [];
        this.savedChannels = this.loadSavedChannels();
        this.currentTheme = this.loadTheme();
        this.currentHls = null;
        this.isPlaying = false;
        this.currentStreamUrl = '';
        this.currentChannel = null;
        
        // DOM Elements
        this.elements = {
            channelGrid: document.getElementById('channelGrid'),
            channelCount: document.getElementById('channelCount'),
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            countryFilter: document.getElementById('countryFilter'),
            categoryFilter: document.getElementById('categoryFilter'),
            qualityFilter: document.getElementById('qualityFilter'),
            savedFilter: document.getElementById('savedFilter'),
            resetFilters: document.getElementById('resetFilters'),
            gridViewBtn: document.getElementById('gridViewBtn'),
            listViewBtn: document.getElementById('listViewBtn'),
            loading: document.getElementById('loading'),
            noResults: document.getElementById('noResults'),
            playerModal: document.getElementById('playerModal'),
            playerTitle: document.getElementById('playerTitle'),
            closePlayer: document.getElementById('closePlayer'),
            videoPlayer: document.getElementById('videoPlayer'),
            playerError: document.getElementById('playerError'),
            retryBtn: document.getElementById('retryBtn'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            playIcon: document.getElementById('playIcon'),
            pauseIcon: document.getElementById('pauseIcon'),
            muteBtn: document.getElementById('muteBtn'),
            volumeSlider: document.getElementById('volumeSlider'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            channelQuality: document.getElementById('channelQuality'),
            channelCountry: document.getElementById('channelCountry'),
            saveChannelBtn: document.getElementById('saveChannelBtn'),
            saveIcon: document.getElementById('saveIcon'),
            savedIcon: document.getElementById('savedIcon'),
            mobileFilterToggle: document.getElementById('mobileFilterToggle'),
            sidebar: document.querySelector('.sidebar'),
            themeToggle: document.getElementById('themeToggle'),
            sunIcon: document.getElementById('sunIcon'),
            moonIcon: document.getElementById('moonIcon')
        };
        
        this.init();
    }
    
    // Load theme from localStorage
    loadTheme() {
        try {
            const savedTheme = localStorage.getItem(THEME_KEY);
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
                return savedTheme;
            }
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                document.documentElement.setAttribute('data-theme', 'light');
                return 'light';
            }
            return 'dark';
        } catch (e) {
            return 'dark';
        }
    }
    
    // Save theme to localStorage
    saveTheme(theme) {
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.error('Error saving theme:', e);
        }
    }
    
    // Toggle theme
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        this.saveTheme(this.currentTheme);
        this.updateThemeUI();
    }
    
    // Update theme toggle button UI
    updateThemeUI() {
        if (this.currentTheme === 'light') {
            this.elements.sunIcon.classList.add('hidden');
            this.elements.moonIcon.classList.remove('hidden');
        } else {
            this.elements.sunIcon.classList.remove('hidden');
            this.elements.moonIcon.classList.add('hidden');
        }
    }
    
    // Load saved channels from localStorage
    loadSavedChannels() {
        try {
            const saved = localStorage.getItem(SAVED_CHANNELS_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading saved channels:', e);
            return [];
        }
    }
    
    // Save channels to localStorage
    saveSavedChannels() {
        try {
            localStorage.setItem(SAVED_CHANNELS_KEY, JSON.stringify(this.savedChannels));
        } catch (e) {
            console.error('Error saving channels:', e);
        }
    }
    
    // Check if a channel is saved
    isChannelSaved(channelId) {
        return this.savedChannels.includes(channelId);
    }
    
    // Toggle save status of a channel
    toggleSaveChannel(channelId) {
        const index = this.savedChannels.indexOf(channelId);
        if (index > -1) {
            this.savedChannels.splice(index, 1);
        } else {
            this.savedChannels.push(channelId);
        }
        this.saveSavedChannels();
        this.updateSaveButtonUI();
        this.renderChannels();
    }
    
    // Update save button UI based on current channel
    updateSaveButtonUI() {
        if (!this.currentChannel) return;
        const isSaved = this.isChannelSaved(this.currentChannel.id);
        if (isSaved) {
            this.elements.saveIcon.classList.add('hidden');
            this.elements.savedIcon.classList.remove('hidden');
            this.elements.saveChannelBtn.classList.add('saved');
        } else {
            this.elements.saveIcon.classList.remove('hidden');
            this.elements.savedIcon.classList.add('hidden');
            this.elements.saveChannelBtn.classList.remove('saved');
        }
    }
    
    async init() {
        this.updateThemeUI();
        await this.loadChannels();
        this.setupEventListeners();
        this.renderChannels();
    }
    
    async loadChannels() {
        try {
            // Load channels from multiple m3u files
            const response = await fetch('./channels.json');
            if (response.ok) {
                this.channels = await response.json();
            } else {
                // Fallback: parse m3u files directly
                await this.loadFromM3UFiles();
            }
        } catch (error) {
            console.error('Error loading channels:', error);
            // Try loading from M3U files as fallback
            await this.loadFromM3UFiles();
        } finally {
            this.filteredChannels = [...this.channels];
            this.populateCountryFilter();
            this.populateCategoryFilter();
            this.updateChannelCount();
            this.elements.loading.classList.add('hidden');
        }
    }
    
    async loadFromM3UFiles() {
        // Complete list of ALL m3u files to load (includes extended files like us_pluto, uk_samsung, etc.)
        const m3uFiles = [
            'ad', 'ae', 'af', 'ag', 'al', 'am', 'ao', 'ar', 'at', 'at_plutotv', 'at_samsung', 'au', 'au_samsung', 'aw', 'az',
            'ba', 'ba_morescreens', 'bb', 'bd', 'be', 'be_samsung', 'bf', 'bg', 'bh', 'bi', 'bj', 'bm', 'bn', 'bo', 'bq', 'br', 'br_pluto', 'br_samsung', 'bs', 'bw', 'by', 'bz', 'bz_nexgen',
            'ca', 'ca_pluto', 'ca_samsung', 'ca_stingray', 'cd', 'cf', 'cg', 'ch', 'ch_pluto', 'ch_samsung', 'ci', 'cl', 'cm', 'cn', 'cn_112114', 'cn_cctv', 'cn_cgtn', 'cn_yeslivetv', 'co', 'cr', 'cu', 'cv', 'cw', 'cy', 'cz',
            'de', 'de_pluto', 'de_rakuten', 'de_samsung', 'dj', 'dk', 'dk_samsung', 'dm', 'do', 'dz',
            'ec', 'ee', 'eg', 'eh', 'er', 'es', 'es_pluto', 'es_rakuten', 'es_samsung', 'es_yowi', 'et',
            'fi', 'fi_rakuten', 'fi_samsung', 'fj', 'fm', 'fo', 'fr', 'fr_bfm', 'fr_fashiontv', 'fr_groupecanalplus', 'fr_groupem6', 'fr_persiana', 'fr_pluto', 'fr_rakuten', 'fr_samsung',
            'ga', 'ge', 'gf', 'gh', 'gl', 'gm', 'gn', 'gp', 'gq', 'gr', 'gt', 'gu', 'gy',
            'hk', 'hn', 'hr', 'ht', 'hu',
            'id', 'ie', 'ie_samsung', 'il', 'in', 'in_samsung', 'iq', 'ir', 'ir_lenz', 'ir_telewebion', 'ir_wnslive', 'is', 'it', 'it_pluto', 'it_rakuten', 'it_samsung',
            'jm', 'jo', 'jp',
            'ke', 'kg', 'kh', 'kh_happywatch99', 'km', 'kn', 'kp', 'kr', 'kw', 'kz',
            'la', 'lb', 'lc', 'li', 'lk', 'lr', 'lt', 'lu', 'lu_samsung', 'lv', 'ly',
            'ma', 'mc', 'md', 'me', 'mg', 'mk', 'ml', 'mm', 'mn', 'mo', 'mq', 'mr', 'mt', 'mt_smashplus', 'mu', 'mv', 'mw', 'mx', 'mx_amagi', 'mx_multimedios', 'mx_pluto', 'mx_samsung', 'my', 'mz',
            'na', 'ne', 'ng', 'ni', 'nl', 'nl_samsung', 'no', 'no_samsung', 'np', 'nz', 'nz_samsung',
            'om',
            'pa', 'pe', 'pe_opencaster', 'pf', 'pg', 'ph', 'pk', 'pl', 'pl_mediateka', 'pl_rakuten', 'pr', 'ps', 'pt', 'pt_samsung', 'py',
            'qa',
            'ro', 'rs', 'ru', 'ru_bonustv', 'ru_catcast', 'ru_mylifeisgood', 'ru_ntv', 'ru_rt', 'ru_smotrim', 'ru_televizor24', 'ru_tvbricks', 'ru_tvteleport', 'ru_zabava', 'rw',
            'sa', 'sd', 'se', 'se_samsung', 'sg', 'si', 'si_xploretv', 'sk', 'sl', 'sm', 'sn', 'so', 'so_premiumfree', 'sr', 'st', 'sv', 'sx', 'sy',
            'td', 'tg', 'th', 'th_v2hcdn', 'tj', 'tl', 'tm', 'tn', 'tr', 'tr_gem', 'tr_onetv', 'tt', 'tw', 'tz',
            'ua', 'ug', 'uk', 'uk_bbc', 'uk_pluto', 'uk_rakuten', 'uk_samsung', 'uk_sportstribal', 'us', 'us_30a', 'us_3abn', 'us_abcnews', 'us_amagi', 'us_canelatv', 'us_cbsn', 'us_cineversetv', 'us_distro', 'us_firetv', 'us_frequency', 'us_glewedtv', 'us_klowdtv', 'us_local', 'us_moveonjoy', 'us_pbs', 'us_plex', 'us_pluto', 'us_roku', 'us_samsung', 'us_sofast', 'us_ssh101', 'us_stirr', 'us_tcl', 'us_tubi', 'us_tvpass', 'us_vizio', 'us_wfmz', 'us_xumo', 'uy', 'uz',
            'va', 've', 'vg', 'vi', 'vn',
            'ws',
            'xk',
            'ye', 'yt',
            'za', 'za_freevisiontv', 'zm', 'zw'
        ];
        const channels = [];
        
        // Use GitHub raw content URLs to fetch m3u files
        const baseUrl = 'https://raw.githubusercontent.com/iptv-org/iptv/master/streams';
        
        // Fetch channels in parallel batches to improve performance
        // Batch size of 20 balances parallel loading speed vs avoiding too many concurrent requests
        const batchSize = 20;
        for (let i = 0; i < m3uFiles.length; i += batchSize) {
            const batch = m3uFiles.slice(i, i + batchSize);
            const promises = batch.map(async filename => {
                try {
                    const response = await fetch(`${baseUrl}/${filename}.m3u`);
                    if (response.ok) {
                        const content = await response.text();
                        // Extract country code from filename (e.g., 'us_pluto' -> 'US', 'uk' -> 'UK')
                        const countryCode = filename.split('_')[0].toUpperCase();
                        return this.parseM3U(content, countryCode);
                    }
                } catch (error) {
                    console.log(`Could not load ${filename}.m3u`);
                }
                return [];
            });
            
            const results = await Promise.all(promises);
            results.forEach(parsed => channels.push(...parsed));
        }
        
        this.channels = channels;
        this.filteredChannels = [...channels];
    }
    
    parseM3U(content, countryCode) {
        const channels = [];
        const lines = content.split('\n');
        let currentChannel = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXTINF:')) {
                // Parse channel info
                const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
                const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);
                const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                const nameMatch = line.match(/,(.+)$/);
                
                // Extract quality from name
                const qualityMatch = nameMatch ? nameMatch[1].match(/\((\d+p)\)/) : null;
                
                currentChannel = {
                    id: tvgIdMatch ? tvgIdMatch[1] : `channel-${i}`,
                    name: nameMatch ? nameMatch[1].replace(/\s*\(\d+p\)\s*/, '').replace(/\s*\[.*?\]\s*/, '').trim() : 'Unknown Channel',
                    logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
                    group: groupTitleMatch ? groupTitleMatch[1] : '',
                    quality: qualityMatch ? qualityMatch[1] : '',
                    country: countryCode,
                    url: ''
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        
        return channels;
    }
    
    populateCountryFilter() {
        const countries = [...new Set(this.channels.map(c => c.country))].filter(Boolean).sort();
        const countryNames = this.getCountryNames();
        
        countries.forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = countryNames[code] || code;
            this.elements.countryFilter.appendChild(option);
        });
    }
    
    getCountryNames() {
        return {
            'AD': 'Andorra',
            'AE': 'United Arab Emirates',
            'AF': 'Afghanistan',
            'AG': 'Antigua and Barbuda',
            'AL': 'Albania',
            'AM': 'Armenia',
            'AO': 'Angola',
            'AR': 'Argentina',
            'AT': 'Austria',
            'AU': 'Australia',
            'AW': 'Aruba',
            'AZ': 'Azerbaijan',
            'BA': 'Bosnia and Herzegovina',
            'BB': 'Barbados',
            'BD': 'Bangladesh',
            'BE': 'Belgium',
            'BF': 'Burkina Faso',
            'BG': 'Bulgaria',
            'BH': 'Bahrain',
            'BI': 'Burundi',
            'BJ': 'Benin',
            'BM': 'Bermuda',
            'BN': 'Brunei',
            'BO': 'Bolivia',
            'BQ': 'Bonaire, Sint Eustatius and Saba',
            'BR': 'Brazil',
            'BS': 'Bahamas',
            'BW': 'Botswana',
            'BY': 'Belarus',
            'BZ': 'Belize',
            'CA': 'Canada',
            'CD': 'DR Congo',
            'CF': 'Central African Republic',
            'CG': 'Republic of the Congo',
            'CH': 'Switzerland',
            'CI': 'Ivory Coast',
            'CL': 'Chile',
            'CM': 'Cameroon',
            'CN': 'China',
            'CO': 'Colombia',
            'CR': 'Costa Rica',
            'CU': 'Cuba',
            'CV': 'Cape Verde',
            'CW': 'Curaçao',
            'CY': 'Cyprus',
            'CZ': 'Czech Republic',
            'DE': 'Germany',
            'DJ': 'Djibouti',
            'DK': 'Denmark',
            'DM': 'Dominica',
            'DO': 'Dominican Republic',
            'DZ': 'Algeria',
            'EC': 'Ecuador',
            'EE': 'Estonia',
            'EG': 'Egypt',
            'EH': 'Western Sahara',
            'ER': 'Eritrea',
            'ES': 'Spain',
            'ET': 'Ethiopia',
            'FI': 'Finland',
            'FJ': 'Fiji',
            'FM': 'Micronesia',
            'FO': 'Faroe Islands',
            'FR': 'France',
            'GA': 'Gabon',
            'GE': 'Georgia',
            'GF': 'French Guiana',
            'GH': 'Ghana',
            'GL': 'Greenland',
            'GM': 'Gambia',
            'GN': 'Guinea',
            'GP': 'Guadeloupe',
            'GQ': 'Equatorial Guinea',
            'GR': 'Greece',
            'GT': 'Guatemala',
            'GU': 'Guam',
            'GY': 'Guyana',
            'HK': 'Hong Kong',
            'HN': 'Honduras',
            'HR': 'Croatia',
            'HT': 'Haiti',
            'HU': 'Hungary',
            'ID': 'Indonesia',
            'IE': 'Ireland',
            'IL': 'Israel',
            'IN': 'India',
            'IQ': 'Iraq',
            'IR': 'Iran',
            'IS': 'Iceland',
            'IT': 'Italy',
            'JM': 'Jamaica',
            'JO': 'Jordan',
            'JP': 'Japan',
            'KE': 'Kenya',
            'KG': 'Kyrgyzstan',
            'KH': 'Cambodia',
            'KM': 'Comoros',
            'KN': 'Saint Kitts and Nevis',
            'KP': 'North Korea',
            'KR': 'South Korea',
            'KW': 'Kuwait',
            'KZ': 'Kazakhstan',
            'LA': 'Laos',
            'LB': 'Lebanon',
            'LC': 'Saint Lucia',
            'LI': 'Liechtenstein',
            'LK': 'Sri Lanka',
            'LR': 'Liberia',
            'LT': 'Lithuania',
            'LU': 'Luxembourg',
            'LV': 'Latvia',
            'LY': 'Libya',
            'MA': 'Morocco',
            'MC': 'Monaco',
            'MD': 'Moldova',
            'ME': 'Montenegro',
            'MG': 'Madagascar',
            'MK': 'North Macedonia',
            'ML': 'Mali',
            'MM': 'Myanmar',
            'MN': 'Mongolia',
            'MO': 'Macau',
            'MQ': 'Martinique',
            'MR': 'Mauritania',
            'MT': 'Malta',
            'MU': 'Mauritius',
            'MV': 'Maldives',
            'MW': 'Malawi',
            'MX': 'Mexico',
            'MY': 'Malaysia',
            'MZ': 'Mozambique',
            'NA': 'Namibia',
            'NE': 'Niger',
            'NG': 'Nigeria',
            'NI': 'Nicaragua',
            'NL': 'Netherlands',
            'NO': 'Norway',
            'NP': 'Nepal',
            'NZ': 'New Zealand',
            'OM': 'Oman',
            'PA': 'Panama',
            'PE': 'Peru',
            'PF': 'French Polynesia',
            'PG': 'Papua New Guinea',
            'PH': 'Philippines',
            'PK': 'Pakistan',
            'PL': 'Poland',
            'PR': 'Puerto Rico',
            'PS': 'Palestine',
            'PT': 'Portugal',
            'PY': 'Paraguay',
            'QA': 'Qatar',
            'RO': 'Romania',
            'RS': 'Serbia',
            'RU': 'Russia',
            'RW': 'Rwanda',
            'SA': 'Saudi Arabia',
            'SD': 'Sudan',
            'SE': 'Sweden',
            'SG': 'Singapore',
            'SI': 'Slovenia',
            'SK': 'Slovakia',
            'SL': 'Sierra Leone',
            'SM': 'San Marino',
            'SN': 'Senegal',
            'SO': 'Somalia',
            'SR': 'Suriname',
            'ST': 'São Tomé and Príncipe',
            'SV': 'El Salvador',
            'SX': 'Sint Maarten',
            'SY': 'Syria',
            'TD': 'Chad',
            'TG': 'Togo',
            'TH': 'Thailand',
            'TJ': 'Tajikistan',
            'TL': 'Timor-Leste',
            'TM': 'Turkmenistan',
            'TN': 'Tunisia',
            'TR': 'Turkey',
            'TT': 'Trinidad and Tobago',
            'TW': 'Taiwan',
            'TZ': 'Tanzania',
            'UA': 'Ukraine',
            'UG': 'Uganda',
            'UK': 'United Kingdom',
            'US': 'United States',
            'UY': 'Uruguay',
            'UZ': 'Uzbekistan',
            'VA': 'Vatican City',
            'VE': 'Venezuela',
            'VG': 'British Virgin Islands',
            'VI': 'U.S. Virgin Islands',
            'VN': 'Vietnam',
            'WS': 'Samoa',
            'XK': 'Kosovo',
            'YE': 'Yemen',
            'YT': 'Mayotte',
            'ZA': 'South Africa',
            'ZM': 'Zambia',
            'ZW': 'Zimbabwe'
        };
    }
    
    // Category keywords for auto-categorization based on channel name
    getCategoryKeywords() {
        return {
            'Sports': ['sport', 'espn', 'fox sports', 'bein', 'sky sports', 'eurosport', 'nba', 'nfl', 'mlb', 'nhl', 'football', 'soccer', 'tennis', 'golf', 'cricket', 'rugby', 'wrestling', 'wwe', 'ufc', 'boxing', 'motorsport', 'racing', 'f1', 'formula', 'olympic', 'athletic', 'stadium', 'match', 'game'],
            'Movies': ['movie', 'cinema', 'film', 'hbo', 'showtime', 'cinemax', 'starz', 'hallmark', 'lifetime', 'amc', 'tcm', 'mgm', 'paramount', 'universal', 'sony', 'lionsgate', 'filmbox', 'cinemoi'],
            'News': ['news', 'cnn', 'bbc news', 'fox news', 'msnbc', 'abc news', 'cbs news', 'nbc news', 'al jazeera', 'reuters', 'euronews', 'sky news', 'france 24', 'rt news', 'dw news', 'nhk world', 'press tv', 'headline', 'breaking'],
            'Entertainment': ['entertainment', 'bravo', 'tlc', 'comedy', 'funny', 'laugh', 'variety', 'talent', 'reality', 'drama', 'teleseries'],
            'Music': ['music', 'mtv', 'vh1', 'vevo', 'radio', 'hip hop', 'rock', 'jazz', 'classical', 'latin music', 'concert', 'song', 'melody'],
            'Kids': ['kid', 'child', 'cartoon', 'disney', 'nickelodeon', 'nick jr', 'pbs kids', 'boomerang', 'baby', 'junior', 'toon', 'anime', 'animation', 'sesame', 'spongebob'],
            'Documentary': ['documentary', 'discovery', 'national geographic', 'nat geo', 'history', 'animal planet', 'nature', 'science', 'learning', 'educational', 'explore', 'planet earth', 'wild', 'smithsonian'],
            'Religious': ['religious', 'christian', 'church', 'gospel', 'faith', 'prayer', 'god', 'jesus', 'bible', 'catholic', 'islamic', 'muslim', 'quran', 'hindu', 'buddhist', 'spiritual', 'worship', 'ministry', 'ewtn', 'tbn', 'daystar'],
            'Lifestyle': ['lifestyle', 'food', 'cooking', 'travel', 'fashion', 'beauty', 'home', 'garden', 'health', 'fitness', 'wellness', 'shopping', 'diy', 'hgtv', 'style']
        };
    }
    
    // Detect category based on channel name
    detectCategory(channelName) {
        const name = channelName.toLowerCase();
        const keywords = this.getCategoryKeywords();
        
        for (const [category, terms] of Object.entries(keywords)) {
            for (const term of terms) {
                if (name.includes(term.toLowerCase())) {
                    return category;
                }
            }
        }
        return 'General';
    }
    
    // Populate category filter dropdown
    populateCategoryFilter() {
        const categories = ['Sports', 'Movies', 'News', 'Entertainment', 'Music', 'Kids', 'Documentary', 'Religious', 'Lifestyle', 'General'];
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            this.elements.categoryFilter.appendChild(option);
        });
    }
    
    setupEventListeners() {
        // Search
        this.elements.searchInput.addEventListener('input', () => this.filterChannels());
        this.elements.clearSearch.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.filterChannels();
        });
        
        // Filters
        this.elements.countryFilter.addEventListener('change', () => this.filterChannels());
        this.elements.categoryFilter.addEventListener('change', () => this.filterChannels());
        this.elements.qualityFilter.addEventListener('change', () => this.filterChannels());
        this.elements.savedFilter.addEventListener('change', () => this.filterChannels());
        this.elements.resetFilters.addEventListener('click', () => this.resetFilters());
        
        // Theme Toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Mobile Filter Toggle
        this.elements.mobileFilterToggle.addEventListener('click', () => this.toggleMobileFilters());
        
        // View Toggle
        this.elements.gridViewBtn.addEventListener('click', () => this.setView('grid'));
        this.elements.listViewBtn.addEventListener('click', () => this.setView('list'));
        
        // Player Modal
        this.elements.closePlayer.addEventListener('click', () => this.closePlayer());
        this.elements.playerModal.addEventListener('click', (e) => {
            if (e.target === this.elements.playerModal) this.closePlayer();
        });
        
        // Player Controls
        this.elements.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
        this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.elements.retryBtn.addEventListener('click', () => this.retryStream());
        this.elements.saveChannelBtn.addEventListener('click', () => {
            if (this.currentChannel) {
                this.toggleSaveChannel(this.currentChannel.id);
            }
        });
        
        // Video Events
        this.elements.videoPlayer.addEventListener('play', () => this.updatePlayPauseUI(true));
        this.elements.videoPlayer.addEventListener('pause', () => this.updatePlayPauseUI(false));
        this.elements.videoPlayer.addEventListener('error', () => this.showPlayerError());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.elements.playerModal.classList.contains('hidden')) return;
            
            switch (e.key) {
                case 'Escape':
                    this.closePlayer();
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'm':
                    this.toggleMute();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
            }
        });
    }
    
    filterChannels() {
        const search = this.elements.searchInput.value.toLowerCase();
        const country = this.elements.countryFilter.value;
        const category = this.elements.categoryFilter.value;
        const quality = this.elements.qualityFilter.value;
        const savedOnly = this.elements.savedFilter.checked;
        
        this.filteredChannels = this.channels.filter(channel => {
            const matchesSearch = !search || 
                channel.name.toLowerCase().includes(search) ||
                (channel.id && channel.id.toLowerCase().includes(search));
            const matchesCountry = !country || channel.country === country;
            const matchesCategory = !category || this.detectCategory(channel.name) === category;
            const matchesQuality = !quality || channel.quality === quality;
            const matchesSaved = !savedOnly || this.isChannelSaved(channel.id);
            
            return matchesSearch && matchesCountry && matchesCategory && matchesQuality && matchesSaved;
        });
        
        this.updateChannelCount();
        this.renderChannels();
    }
    
    resetFilters() {
        this.elements.searchInput.value = '';
        this.elements.countryFilter.value = '';
        this.elements.categoryFilter.value = '';
        this.elements.qualityFilter.value = '';
        this.elements.savedFilter.checked = false;
        this.filteredChannels = [...this.channels];
        this.updateChannelCount();
        this.renderChannels();
    }
    
    // Toggle mobile filters sidebar
    toggleMobileFilters() {
        this.elements.sidebar.classList.toggle('open');
    }
    
    setView(view) {
        if (view === 'grid') {
            this.elements.channelGrid.classList.remove('list-view');
            this.elements.gridViewBtn.classList.add('active');
            this.elements.listViewBtn.classList.remove('active');
        } else {
            this.elements.channelGrid.classList.add('list-view');
            this.elements.listViewBtn.classList.add('active');
            this.elements.gridViewBtn.classList.remove('active');
        }
    }
    
    updateChannelCount() {
        const count = this.filteredChannels.length;
        this.elements.channelCount.textContent = `${count} channel${count !== 1 ? 's' : ''}`;
    }
    
    renderChannels() {
        if (this.filteredChannels.length === 0) {
            this.elements.channelGrid.innerHTML = '';
            this.elements.noResults.classList.remove('hidden');
            return;
        }
        
        this.elements.noResults.classList.add('hidden');
        
        // Use virtual scrolling / chunking for performance
        const fragment = document.createDocumentFragment();
        const countryNames = this.getCountryNames();
        
        this.filteredChannels.slice(0, MAX_VISIBLE_CHANNELS).forEach(channel => {
            const card = document.createElement('div');
            const isSaved = this.isChannelSaved(channel.id);
            card.className = 'channel-card' + (isSaved ? ' saved' : '');
            card.onclick = () => this.playChannel(channel);
            
            const escapedFirstChar = this.escapeHtml(channel.name.charAt(0));
            const logoHtml = channel.logo 
                ? `<img src="${this.escapeHtml(channel.logo)}" alt="${this.escapeHtml(channel.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'"><span class="channel-logo-placeholder" style="display:none">${escapedFirstChar}</span>`
                : `<span class="channel-logo-placeholder">${escapedFirstChar}</span>`;
            
            const qualityHtml = channel.quality 
                ? `<span class="channel-tag quality">${this.escapeHtml(channel.quality)}</span>` 
                : '';
            
            const countryHtml = channel.country 
                ? `<span class="channel-tag country">${this.escapeHtml(countryNames[channel.country] || channel.country)}</span>` 
                : '';
            
            const category = this.detectCategory(channel.name);
            const categoryHtml = `<span class="channel-tag category">${this.escapeHtml(category)}</span>`;
            
            const savedBadgeHtml = isSaved 
                ? `<span class="saved-badge" title="Saved"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg></span>` 
                : '';
            
            card.innerHTML = `
                <div class="channel-header">
                    <div class="channel-logo">${logoHtml}</div>
                    <div class="channel-info-card">
                        <div class="channel-name">${savedBadgeHtml}${this.escapeHtml(channel.name)}</div>
                        <div class="channel-meta">
                            ${qualityHtml}
                            ${countryHtml}
                            ${categoryHtml}
                        </div>
                    </div>
                </div>
                <div class="play-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
            `;
            
            fragment.appendChild(card);
        });
        
        this.elements.channelGrid.innerHTML = '';
        this.elements.channelGrid.appendChild(fragment);
        
        // Show load more indicator if there are more channels
        if (this.filteredChannels.length > MAX_VISIBLE_CHANNELS) {
            const loadMore = document.createElement('div');
            loadMore.className = 'channel-card';
            loadMore.style.justifyContent = 'center';
            loadMore.style.alignItems = 'center';
            loadMore.innerHTML = `<p style="color: var(--text-secondary);">Showing ${MAX_VISIBLE_CHANNELS} of ${this.filteredChannels.length} channels. Use filters to narrow results.</p>`;
            this.elements.channelGrid.appendChild(loadMore);
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    playChannel(channel) {
        this.currentStreamUrl = channel.url;
        this.currentChannel = channel;
        const countryNames = this.getCountryNames();
        
        // Update modal info
        this.elements.playerTitle.textContent = channel.name;
        this.elements.channelQuality.textContent = channel.quality ? `Quality: ${channel.quality}` : '';
        this.elements.channelCountry.textContent = channel.country ? `Country: ${countryNames[channel.country] || channel.country}` : '';
        
        // Update save button UI
        this.updateSaveButtonUI();
        
        // Show modal
        this.elements.playerModal.classList.remove('hidden');
        this.elements.playerError.classList.add('hidden');
        document.body.style.overflow = 'hidden';
        
        // Close mobile sidebar if open
        this.elements.sidebar.classList.remove('open');
        
        // Initialize player
        this.initPlayer(channel.url);
    }
    
    initPlayer(url) {
        const video = this.elements.videoPlayer;
        
        // Destroy existing HLS instance
        if (this.currentHls) {
            this.currentHls.destroy();
            this.currentHls = null;
        }
        
        // Check if URL is HLS
        if (url.includes('.m3u8') || url.includes('.m3u')) {
            if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                this.currentHls = new Hls({
                    enableWorker: true
                });
                
                this.currentHls.loadSource(url);
                this.currentHls.attachMedia(video);
                
                this.currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(() => {});
                });
                
                this.currentHls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        this.showPlayerError();
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                // Safari native HLS support or fallback
                video.src = url;
                video.play().catch(() => {});
            } else {
                // Try direct playback as last resort
                video.src = url;
                video.play().catch(() => this.showPlayerError());
            }
        } else {
            // Direct video URL
            video.src = url;
            video.play().catch(() => {});
        }
    }
    
    showPlayerError() {
        this.elements.playerError.classList.remove('hidden');
    }
    
    retryStream() {
        this.elements.playerError.classList.add('hidden');
        if (this.currentStreamUrl) {
            this.initPlayer(this.currentStreamUrl);
        }
    }
    
    closePlayer() {
        this.elements.playerModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        // Stop playback
        if (this.currentHls) {
            this.currentHls.destroy();
            this.currentHls = null;
        }
        
        this.elements.videoPlayer.pause();
        this.elements.videoPlayer.src = '';
    }
    
    togglePlayPause() {
        const video = this.elements.videoPlayer;
        if (video.paused) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }
    
    updatePlayPauseUI(isPlaying) {
        this.isPlaying = isPlaying;
        if (isPlaying) {
            this.elements.playIcon.classList.add('hidden');
            this.elements.pauseIcon.classList.remove('hidden');
        } else {
            this.elements.playIcon.classList.remove('hidden');
            this.elements.pauseIcon.classList.add('hidden');
        }
    }
    
    toggleMute() {
        const video = this.elements.videoPlayer;
        video.muted = !video.muted;
        this.elements.volumeSlider.value = video.muted ? 0 : video.volume * 100;
    }
    
    setVolume(value) {
        this.elements.videoPlayer.volume = value / 100;
        this.elements.videoPlayer.muted = value === 0;
    }
    
    toggleFullscreen() {
        const container = this.elements.playerModal.querySelector('.player-container');
        const video = this.elements.videoPlayer;
        
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(() => {
                    // Fallback for iOS
                    if (video.webkitEnterFullscreen) {
                        video.webkitEnterFullscreen();
                    }
                });
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (video.webkitEnterFullscreen) {
                // iOS fallback
                video.webkitEnterFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new IPTVBrowser();
});
