/**
 * Simple script to generate channels.json for the frontend
 * Run with: node scripts/commands/frontend/generate.js
 * 
 * This script has no external dependencies and can be run without npm install
 */

const fs = require('fs')
const path = require('path')

const STREAMS_DIR = path.resolve(__dirname, '../../../streams')
const FRONTEND_DIR = path.resolve(__dirname, '../../../frontend')

function parseM3U(content, countryCode) {
    const channels = []
    const lines = content.split('\n')
    let currentChannel = null
    let lineIndex = 0

    for (const line of lines) {
        const trimmedLine = line.trim()
        lineIndex++

        if (trimmedLine.startsWith('#EXTINF:')) {
            // Parse channel info
            const tvgIdMatch = trimmedLine.match(/tvg-id="([^"]*)"/)
            const tvgLogoMatch = trimmedLine.match(/tvg-logo="([^"]*)"/)
            const groupTitleMatch = trimmedLine.match(/group-title="([^"]*)"/)
            const nameMatch = trimmedLine.match(/,(.+)$/)

            // Extract quality from name
            const name = nameMatch ? nameMatch[1] : 'Unknown Channel'
            const qualityMatch = name.match(/\((\d+p)\)/)

            currentChannel = {
                id: tvgIdMatch ? tvgIdMatch[1] : `${countryCode}-${lineIndex}`,
                name: name.replace(/\s*\(\d+p\)\s*/, '').replace(/\s*\[.*?\]\s*/, '').trim(),
                logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
                group: groupTitleMatch ? groupTitleMatch[1] : '',
                quality: qualityMatch ? qualityMatch[1] : '',
                country: countryCode.toUpperCase(),
                url: ''
            }
        } else if (trimmedLine && !trimmedLine.startsWith('#') && currentChannel) {
            currentChannel.url = trimmedLine
            channels.push(currentChannel)
            currentChannel = null
        }
    }

    return channels
}

function main() {
    console.log('Generating channels.json for frontend...')

    const allChannels = []

    // Read all .m3u files from streams directory
    const files = fs.readdirSync(STREAMS_DIR).filter(f => f.endsWith('.m3u'))

    for (const file of files) {
        const filepath = path.join(STREAMS_DIR, file)
        const filename = path.basename(file, '.m3u')
        // Extract country code from filename (e.g., 'us.m3u' -> 'US', 'us_pluto.m3u' -> 'US')
        const countryCode = filename.split('_')[0]

        try {
            const content = fs.readFileSync(filepath, 'utf8')
            const channels = parseM3U(content, countryCode)
            allChannels.push(...channels)
            console.log(`Parsed ${channels.length} channels from ${file}`)
        } catch (error) {
            console.error(`Error parsing ${file}: ${error.message}`)
        }
    }

    // Sort channels by name
    allChannels.sort((a, b) => a.name.localeCompare(b.name))

    console.log(`Total channels: ${allChannels.length}`)

    // Ensure frontend directory exists
    if (!fs.existsSync(FRONTEND_DIR)) {
        fs.mkdirSync(FRONTEND_DIR, { recursive: true })
    }

    // Save to frontend directory
    fs.writeFileSync(
        path.join(FRONTEND_DIR, 'channels.json'),
        JSON.stringify(allChannels, null, 2)
    )

    console.log('channels.json generated successfully!')
}

main()
