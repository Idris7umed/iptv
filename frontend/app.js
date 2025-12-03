// IPTV Browser Application
const MAX_VISIBLE_CHANNELS = 100;

class IPTVBrowser {
    constructor() {
        this.channels = [];
        this.filteredChannels = [];
        this.currentHls = null;
        this.isPlaying = false;
        this.currentStreamUrl = '';
        
        // DOM Elements
        this.elements = {
            channelGrid: document.getElementById('channelGrid'),
            channelCount: document.getElementById('channelCount'),
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            countryFilter: document.getElementById('countryFilter'),
            qualityFilter: document.getElementById('qualityFilter'),
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
            streamLink: document.getElementById('streamLink'),
            channelQuality: document.getElementById('channelQuality'),
            channelCountry: document.getElementById('channelCountry')
        };
        
        this.init();
    }
    
    async init() {
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
            
            this.filteredChannels = [...this.channels];
            this.populateCountryFilter();
            this.updateChannelCount();
        } catch (error) {
            console.error('Error loading channels:', error);
            // Try loading from M3U files as fallback
            await this.loadFromM3UFiles();
        } finally {
            this.elements.loading.classList.add('hidden');
        }
    }
    
    async loadFromM3UFiles() {
        // List of country m3u files to load (a representative sample)
        const countries = ['us', 'uk', 'de', 'fr', 'es', 'it', 'br', 'in', 'ca', 'au', 'mx', 'jp', 'kr', 'ru', 'tr'];
        const channels = [];
        
        for (const country of countries) {
            try {
                const response = await fetch(`../streams/${country}.m3u`);
                if (response.ok) {
                    const content = await response.text();
                    const parsed = this.parseM3U(content, country.toUpperCase());
                    channels.push(...parsed);
                }
            } catch (error) {
                console.log(`Could not load ${country}.m3u`);
            }
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
            'US': 'United States',
            'UK': 'United Kingdom',
            'DE': 'Germany',
            'FR': 'France',
            'ES': 'Spain',
            'IT': 'Italy',
            'BR': 'Brazil',
            'IN': 'India',
            'CA': 'Canada',
            'AU': 'Australia',
            'MX': 'Mexico',
            'JP': 'Japan',
            'KR': 'South Korea',
            'RU': 'Russia',
            'TR': 'Turkey',
            'AR': 'Argentina',
            'PL': 'Poland',
            'NL': 'Netherlands',
            'BE': 'Belgium',
            'CH': 'Switzerland',
            'AT': 'Austria',
            'PT': 'Portugal',
            'GR': 'Greece',
            'SE': 'Sweden',
            'NO': 'Norway',
            'DK': 'Denmark',
            'FI': 'Finland',
            'IE': 'Ireland',
            'NZ': 'New Zealand',
            'ZA': 'South Africa',
            'EG': 'Egypt',
            'AE': 'UAE',
            'SA': 'Saudi Arabia',
            'PK': 'Pakistan',
            'BD': 'Bangladesh',
            'ID': 'Indonesia',
            'MY': 'Malaysia',
            'TH': 'Thailand',
            'VN': 'Vietnam',
            'PH': 'Philippines',
            'SG': 'Singapore',
            'HK': 'Hong Kong',
            'TW': 'Taiwan',
            'CN': 'China'
        };
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
        this.elements.qualityFilter.addEventListener('change', () => this.filterChannels());
        this.elements.resetFilters.addEventListener('click', () => this.resetFilters());
        
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
        const quality = this.elements.qualityFilter.value;
        
        this.filteredChannels = this.channels.filter(channel => {
            const matchesSearch = !search || 
                channel.name.toLowerCase().includes(search) ||
                (channel.id && channel.id.toLowerCase().includes(search));
            const matchesCountry = !country || channel.country === country;
            const matchesQuality = !quality || channel.quality === quality;
            
            return matchesSearch && matchesCountry && matchesQuality;
        });
        
        this.updateChannelCount();
        this.renderChannels();
    }
    
    resetFilters() {
        this.elements.searchInput.value = '';
        this.elements.countryFilter.value = '';
        this.elements.qualityFilter.value = '';
        this.filteredChannels = [...this.channels];
        this.updateChannelCount();
        this.renderChannels();
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
            card.className = 'channel-card';
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
            
            card.innerHTML = `
                <div class="channel-header">
                    <div class="channel-logo">${logoHtml}</div>
                    <div class="channel-info-card">
                        <div class="channel-name">${this.escapeHtml(channel.name)}</div>
                        <div class="channel-meta">
                            ${qualityHtml}
                            ${countryHtml}
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
        const countryNames = this.getCountryNames();
        
        // Update modal info
        this.elements.playerTitle.textContent = channel.name;
        this.elements.streamLink.href = channel.url;
        this.elements.channelQuality.textContent = channel.quality ? `Quality: ${channel.quality}` : '';
        this.elements.channelCountry.textContent = channel.country ? `Country: ${countryNames[channel.country] || channel.country}` : '';
        
        // Show modal
        this.elements.playerModal.classList.remove('hidden');
        this.elements.playerError.classList.add('hidden');
        document.body.style.overflow = 'hidden';
        
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
