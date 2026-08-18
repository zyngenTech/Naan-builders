/**
 * Font Awesome subset builder  —  RUN THIS ON YOUR MACHINE, ONCE.
 *
 *   npm i -D fontawesome-subset @fortawesome/fontawesome-free
 *   node scripts/build-fontawesome-subset.mjs
 *
 * WHY: the CDN build of Font Awesome ships two full webfonts —
 * fa-solid-900.woff2 (153 KB) and fa-brands-400.woff2 (116 KB) = 269 KB,
 * which is 46% of the entire page weight, for 57 icons. Lighthouse's
 * network trace shows both downloading at VeryHigh priority inside the
 * critical window, starving the hero image and Playfair Display of
 * bandwidth. That is the single largest remaining cause of a slow LCP.
 *
 * This regenerates the same two fonts containing ONLY the icons this
 * codebase actually uses (list below was extracted from the templates,
 * not guessed), which takes 269 KB down to roughly 10-15 KB.
 *
 * Icon rendering is byte-identical: same font family, same glyphs, same
 * class names. Nothing in any template changes.
 */
import { fontawesomeSubset } from 'fontawesome-subset';

const ICONS = {
  solid: [
    'arrow-left', 'arrow-right', 'arrow-up', 'building-columns', 'bullseye',
    'calendar', 'check', 'chevron-left', 'chevron-right', 'circle-check',
    'circle-exclamation', 'circle-info', 'circle-play', 'compass-drafting',
    'couch', 'drafting-compass', 'envelope', 'envelope-open-text', 'eye',
    'file-signature', 'floppy-disk', 'gauge-high', 'hammer', 'helmet-safety',
    'house', 'house-chimney', 'house-crack', 'image', 'images', 'key', 'link',
    'list-check', 'location-dot', 'magnifying-glass-plus', 'paper-plane', 'pen',
    'phone', 'plus', 'quote-left', 'right-from-bracket', 'right-to-bracket', 'ruler',
    'ruler-combined', 'spinner', 'star', 'timeline', 'trash',
    'triangle-exclamation', 'trowel-bricks', 'upload', 'user', 'video', 'xmark',
  ],
  brands: ['facebook', 'instagram', 'linkedin', 'whatsapp', 'youtube'],
};

const OUT = 'src/assets/fonts/fa';

const ok = await fontawesomeSubset(ICONS, OUT, { targetFormats: ['woff2'] });

console.log(ok ? `\n✅ Subset written to ${OUT}` : '\n❌ Subset failed');
console.log(`   solid: ${ICONS.solid.length} icons, brands: ${ICONS.brands.length} icons`);
console.log('\nNow send me the output of:');
console.log('   ls -l src/assets/fonts/fa');
console.log('and I will wire up the CSS and index.html to use it.\n');
