ICON PLACEHOLDER

Place your app icons here:
- icon-192.png (192x192 pixels) - Used for Android/PWA home screen
- icon-512.png (512x512 pixels) - Used for splash screen and high-DPI displays

GENERATING ICONS:
You can generate PNG icons using any of these methods:

1. Online tools:
   - https://favicon.io/favicon-generator/ (generates multiple sizes)
   - https://realfavicongenerator.net/

2. Using ImageMagick (if installed):
   magick -size 192x192 xc:#6366f1 -fill white -font Arial-Bold -pointsize 90 -gravity Center -annotate 0 "S" icon-192.png
   magick -size 512x512 xc:#6366f1 -fill white -font Arial-Bold -pointsize 240 -gravity Center -annotate 0 "S" icon-512.png

3. Using Node.js canvas (add to a separate script):
   npm install canvas
   Then run the generate-icons.js script.

COLORS:
- Background: #6366f1 (Indigo - matches theme)
- Text: #ffffff (White)
- Letter: S (for SecureSchedule)
