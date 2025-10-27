# Deployment Guide

## Quick Deployment to Vercel

### Option 1: Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Navigate to the project directory:
```bash
cd xslt-generator
```

3. Login to Vercel:
```bash
vercel login
```

4. Deploy:
```bash
vercel
```

5. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? Accept default or customize
   - Directory? Accept default (.)
   - Override settings? **N**

6. For production deployment:
```bash
vercel --prod
```

### Option 2: GitHub Integration

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: XSLT Generator"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [Vercel Dashboard](https://vercel.com/dashboard)

3. Click "Add New Project"

4. Import your GitHub repository

5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. Click "Deploy"

### Option 3: Vercel Drop

1. Build the project locally:
```bash
npm run build
```

2. Go to [Vercel Drop](https://vercel.com/new/upload)

3. Drag and drop the `dist` folder

4. Your app will be deployed instantly!

## Environment Configuration

No environment variables are required for basic functionality.

## Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

**Issue**: Node version mismatch
**Solution**: Vercel uses Node 18+ by default. If you need a specific version, create a `.nvmrc` file:
```
18
```

**Issue**: Dependencies not installing
**Solution**: Clear cache and redeploy:
```bash
vercel --force
```

### Runtime Errors

**Issue**: Files not found (404)
**Solution**: Ensure `vercel.json` has the correct rewrites configuration (already included)

**Issue**: Large XML files cause performance issues
**Solution**: Consider adding file size limits in the FileUpload component

## Performance Optimization

### For Production

1. Enable compression (handled by Vercel automatically)
2. Consider adding a CDN for static assets
3. Monitor with Vercel Analytics

### Optional Enhancements

Add to `package.json`:
```json
{
  "scripts": {
    "analyze": "vite build --mode analyze"
  }
}
```

## Post-Deployment Checklist

- [ ] Test XML file upload
- [ ] Verify all three output formats (XML, JSON, Flat)
- [ ] Test mapping interface
- [ ] Verify XSLT generation and download
- [ ] Check responsive design on mobile
- [ ] Test with sample.xml file
- [ ] Verify error handling

## Monitoring

Vercel automatically provides:
- Analytics
- Error tracking
- Performance insights

Access these in your Vercel Dashboard under your project.

## Rollback

To rollback to a previous deployment:
```bash
vercel rollback
```

Or use the Vercel Dashboard to select a previous deployment.

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Review build logs in Vercel Dashboard
3. Check browser console for client-side errors

## Estimated Deployment Time

- Initial build: 2-3 minutes
- Subsequent builds: 1-2 minutes
- Static deployment (Option 3): < 1 minute

## Cost

- Free tier includes:
  - Unlimited deployments
  - 100GB bandwidth/month
  - Automatic SSL
  - Custom domains

Perfect for this application!
