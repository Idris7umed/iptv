# IPTV Browser Frontend

A modern, responsive web frontend for browsing and playing IPTV channels from the repository.

## Features

- **Channel Listing**: Browse 12,000+ IPTV channels in a beautiful grid or list view
- **Search**: Instantly search channels by name
- **Filters**: Filter channels by country and video quality (1080p, 720p, 480p, 360p)
- **Video Player**: Built-in HLS video player with playback controls
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Easy on the eyes dark theme interface

## Screenshots

### Main View
![Main View](https://github.com/user-attachments/assets/fa631cf5-68e9-4e68-b2b5-e48017fc8590)

### Video Player
![Video Player](https://github.com/user-attachments/assets/2d77d5c3-a875-4c7d-9151-f77ef54eef83)

## Usage

### Quick Start (Local Development)

1. Generate the channels.json file:
   ```bash
   node scripts/commands/frontend/generate.js
   ```

2. Start a local server:
   ```bash
   npx http-server frontend -p 3000 -c-1
   ```

3. Open http://localhost:3000 in your browser

### Using npm scripts

```bash
# Generate channels.json
npm run frontend:generate

# Start local development server
npm run frontend:serve
```

## Files

- `index.html` - Main HTML page
- `styles.css` - CSS styles with dark theme
- `app.js` - JavaScript application code
- `channels.json` - Generated channel data (not committed, generate locally)

## Technical Details

- **No build step required** - Pure HTML, CSS, and JavaScript
- **HLS.js** - For playing HLS streams (loaded from CDN)
- **Responsive** - Uses CSS Grid for responsive layouts
- **Performance** - Lazy loads channels (shows first 100, use filters to find more)

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (native HLS support)
- Mobile browsers

## Notes

- Some streams may not play due to CORS restrictions or geo-blocking
- The `channels.json` file is not committed to the repository - generate it locally
- For best playback results, use a browser that supports HLS.js or native HLS
