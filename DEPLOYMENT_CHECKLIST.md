# Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment Testing (Local)

### Build Verification
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] Output location: `dist/civil-engineer-portfolio/`
- [ ] Bundle size is reasonable (~231 kB gzipped)

### Functional Testing
- [ ] All pages load without console errors
- [ ] Gallery loads and images display
- [ ] Hero images load with high priority
- [ ] Project cards display cover images correctly
- [ ] Lightbox fullscreen images display
- [ ] Clicking between pages works smoothly
- [ ] Admin dashboard loads and functions

### Performance Testing
- [ ] Open Chrome DevTools → Network tab
- [ ] Set throttling to "Slow 3G"
- [ ] Reload home page
- [ ] Hero image (LCP) loads in 1-1.5 seconds
- [ ] Firebase Firestore calls: 2-3 (not 8-10)
- [ ] No layout shift (CLS) during load
- [ ] Images load progressively as you scroll

### Image Loading
- [ ] Cloudinary images optimize (w_800, f_auto, q_auto added to URLs)
- [ ] Firebase Storage images load fine (unmodified URLs)
- [ ] External images load fine (unmodified URLs)
- [ ] Missing images show fallback placeholder (not broken icon)

### Cache Testing
- [ ] Reload home page - Firebase calls reduced on second load
- [ ] Navigate to different pages and back - settings cached
- [ ] Wait 5+ minutes - cache should auto-refresh
- [ ] Update admin settings - cache invalidates, fresh data loads

### Mobile Testing
- [ ] Test on iPhone/iPad Safari
- [ ] Test on Android Chrome
- [ ] Landscape and portrait orientations work
- [ ] Touch interactions work (clicks, swipes, etc.)
- [ ] Images don't get distorted on small screens

### Lighthouse Audit
- [ ] Run Lighthouse audit (Chrome DevTools)
- [ ] Performance score > 90 on mobile
- [ ] Performance score > 95 on desktop
- [ ] Check Core Web Vitals:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID/INP (Interaction) < 100ms
  - CLS (Layout Shift) < 0.1
- [ ] No critical audits failing

## Pre-Deployment Verification

### Environment Check
- [ ] Firebase config is correct (firebaserc, env variables)
- [ ] Cloudinary account linked properly
- [ ] All secrets/credentials secure (not in code)

### Code Review
- [ ] No debug console.log() statements left
- [ ] No commented-out code
- [ ] TypeScript strict mode compliant
- [ ] No unused imports or variables

### Backup
- [ ] Created backup of current Firebase rules
- [ ] Created backup of current Firestore data (optional)
- [ ] Git repository is clean and committed

## Deployment Steps

### Option 1: Firebase Hosting (Recommended)

```bash
# 1. Ensure build is ready
npm run build

# 2. Test locally before deploying
npx http-server dist/civil-engineer-portfolio

# 3. Login to Firebase (if not already)
firebase login

# 4. Deploy to Firebase Hosting
firebase deploy

# 5. Verify deployment
# Check Firebase Console → Hosting → Releases
```

### Option 2: Manual Deployment

```bash
# 1. Build the project
npm run build

# 2. Take the contents of dist/civil-engineer-portfolio/
# 3. Upload to your hosting provider
# 4. Verify all files are uploaded
```

## Post-Deployment Verification

### Live Site Checks
- [ ] Access the live site (no errors in console)
- [ ] All pages load correctly
- [ ] Images load properly
- [ ] Gallery functions
- [ ] Lightbox works
- [ ] Admin panel accessible (login works)

### Performance Verification
- [ ] Open Chrome DevTools on live site
- [ ] Check Network tab - images optimized (Cloudinary transforms applied)
- [ ] Check Firestore calls - 2-3 per page load
- [ ] Run Lighthouse audit on live site
- [ ] Check Core Web Vitals via PageSpeed Insights

### Mobile Verification
- [ ] Test on actual mobile devices
- [ ] Check viewport responsiveness
- [ ] Verify touch interactions
- [ ] Check image quality on different screen sizes

### Monitor Logs
- [ ] Check Firebase hosting logs for errors
- [ ] Monitor Cloudinary transforms being applied
- [ ] Check browser console for any warnings/errors

## Rollback Plan (If Issues)

If problems occur after deployment:

```bash
# Option 1: Rollback with Firebase
firebase hosting:channel:rollback production

# Option 2: Redeploy previous version
# Ensure you have previous dist/ backed up
firebase deploy
```

## Post-Deployment Monitoring

### Week 1
- [ ] Monitor error logs daily
- [ ] Check performance metrics
- [ ] Verify cache is working
- [ ] No user-reported issues

### Week 2-4
- [ ] Monitor sustained performance
- [ ] Review Analytics for page load improvements
- [ ] Check error rates

### Ongoing
- [ ] Monitor Core Web Vitals
- [ ] Track Firebase usage (should be ~75% less)
- [ ] Monitor image optimization metrics

## Performance Baseline

Track these metrics before and after deployment:

| Metric | Target | How to Check |
|--------|--------|-------------|
| LCP (Hero Load) | < 1.5s | Chrome DevTools |
| Firebase Reads | 2-3 per page | Firestore console |
| Bundle Size | 231 kB | Network tab, gzipped |
| Lighthouse Mobile | > 90 | PageSpeed Insights |
| Lighthouse Desktop | > 95 | PageSpeed Insights |
| Page Load (3G) | < 5s | Network throttle |

## Success Criteria

✅ Deployment successful if:
- [ ] No console errors on any page
- [ ] All images load correctly
- [ ] Performance > 90 (mobile) / > 95 (desktop)
- [ ] LCP < 1.5 seconds
- [ ] Firebase calls 70-80% lower
- [ ] No user-reported issues (first 48 hours)

---

## Questions or Issues?

1. Check browser console for errors (F12)
2. Review Deployment Checklist above
3. Check Firebase Console for errors
4. Review OPTIMIZATION_SUMMARY.md for technical details

**Good luck with your deployment! 🚀**
