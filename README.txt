CYDNEYSKEENS.COM — PHASE 3 UPDATE
=================================
Replace these 3 files in the repo root (same names as the repo):
  index.html   style.css   script.js
Nothing else in the site changes (images, models, videos, CNAME stay as they are).

WHAT CHANGED
1. Hero video area is clickable -> https://youtu.be/4fGqLOlAcLg (new tab).
   A "Watch the Video" button was added next to "Start Your Project".
2. ScotCyd section rebuilt as "Learn With ScotCyd":
   - one combined description (the two separate texts were merged)
   - cartoon image sits on top of a single card with the description + links
   - latest episodes shown as an even row on the right (up to 3)
   - TikTok + Rumble added (also in the footer)
   - mobile: card stacks, episodes swipe sideways
3. Footer: TikTok, Rumble and YouTube links added.

ONE THING TO FILL IN (needs 2 minutes)
Open script.js, find SCOTCYD_EPISODES near the bottom, and paste the YouTube IDs
of the next two episodes (the 11 characters after youtu.be/ or /shorts/).
Until then the row shows the one existing episode plus a "More on YouTube" tile.

OPTIONAL: prepare-photos.py batch crops/compresses product photos
(Christmas tree etc.):  python prepare-photos.py input_folder output_folder
