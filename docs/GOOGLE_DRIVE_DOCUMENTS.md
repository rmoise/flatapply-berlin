# Google Drive Document Integration

FlatApply Berlin uses Google Drive links instead of direct file uploads for sensitive documents. This approach prioritizes user privacy and security.

## Why Google Drive Links?

### 🔒 Privacy & Security
- **Your documents stay in your control** - We never store your sensitive files
- **Revoke access anytime** - Just change the sharing settings in Google Drive
- **GDPR compliant** - Minimal data collection reduces compliance burden
- **Bank-level security** - Google's infrastructure protects your documents

### 💰 Benefits for Users
- **One folder, multiple applications** - Share the same link with many landlords
- **Easy updates** - Replace documents without re-uploading
- **Organized documents** - Keep everything in one place
- **No upload limits** - Store as many documents as needed

### 🚀 Benefits for FlatApply
- **No storage costs** - Documents stay on Google's servers
- **Reduced liability** - Not handling sensitive personal data
- **Faster applications** - No upload wait times
- **Lower infrastructure costs** - No need for secure file storage

## User Flow

### 1. Initial Setup (One-time)
```
1. User creates a Google Drive folder named "Rental Documents"
2. Uploads all required documents:
   - SCHUFA report
   - ID/Passport
   - Proof of income (last 3 payslips)
   - Employment contract
   - Bank statements (optional)
3. Sets folder sharing to "Anyone with the link can view"
4. Copies the share link
5. Pastes link in FlatApply dashboard
```

### 2. Applying to Apartments
```
1. User clicks "Apply" on a listing
2. Application includes the Google Drive folder link
3. Landlord receives email with:
   - User's application message
   - Link to document folder
   - Clear list of included documents
```

### 3. Document Updates
```
1. User updates document in Google Drive
2. No action needed in FlatApply
3. Landlords automatically see updated version
```

## Implementation Details

### Database Schema
```sql
-- Documents table stores links, not files
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  document_type TEXT,
  file_name TEXT,
  document_url TEXT, -- Google Drive share link
  link_type TEXT, -- 'google_drive', 'dropbox', etc.
  is_public BOOLEAN,
  last_verified TIMESTAMPTZ
);

-- Document templates for reusable folders
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  name TEXT,
  folder_url TEXT,
  contains_documents TEXT[],
  is_complete BOOLEAN
);
```

### Application Email Template
```html
<h3>📎 Application Documents</h3>
<p>All required documents are available in my Google Drive folder:</p>
<a href="{folder_url}" style="...">View Documents Folder</a>

<p>Included documents:</p>
<ul>
  <li>✓ SCHUFA Report (current)</li>
  <li>✓ ID Copy</li>
  <li>✓ Income Proof (last 3 months)</li>
  <li>✓ Employment Contract</li>
</ul>

<p><small>Can't access? The folder is set to "view-only" for anyone with the link. 
Please let me know if you need a different sharing method.</small></p>
```

### Security Considerations

1. **Link Validation**
   - Verify it's a valid Google Drive URL
   - Check periodically that links still work
   - Notify users if links become invalid

2. **Privacy Settings**
   - Recommend "Anyone with link can view" 
   - Warn against public indexable sharing
   - Provide clear instructions

3. **Alternative Providers**
   - Support Dropbox links
   - Support OneDrive links
   - Allow direct upload as fallback

## Future Enhancements

### Google Drive API Integration (Optional)
If we want tighter integration later:
1. User authorizes FlatApply to access Drive
2. We can list documents in folder
3. Verify document completeness
4. Generate preview thumbnails

### Document Verification
- Check that all required documents are present
- Verify documents are recent (e.g., SCHUFA < 3 months)
- AI-powered document type detection

### Templates & Automation
- Pre-filled folder structures
- Automatic document naming
- Bulk document health checks

## User Education

### In-App Tooltips
```
"💡 Pro tip: Create one 'Rental Documents' folder and reuse it 
for all applications. Update documents once, apply everywhere!"
```

### Help Center Article
```markdown
# How to Organize Your Rental Documents

1. **Create Your Folder**
   - Open Google Drive
   - Create new folder: "Rental Documents - [Your Name]"
   
2. **Upload Documents**
   - SCHUFA (PDF, less than 3 months old)
   - ID/Passport (PDF or image)
   - Income proof (last 3 payslips as PDF)
   - Employment contract (if you have one)
   
3. **Share Your Folder**
   - Right-click the folder
   - Click "Share"
   - Change to "Anyone with the link"
   - Set permission to "Viewer"
   - Copy link
   
4. **Add to FlatApply**
   - Go to Dashboard > Documents
   - Paste your folder link
   - Click "Save"
   
Done! Your documents are now ready for all applications.
```

## Advantages Over Traditional Upload

| Traditional Upload | Google Drive Links |
|-------------------|-------------------|
| Files stored on our servers | Files stay in user's Drive |
| Storage costs | No storage costs |
| Upload size limits | No limits |
| Re-upload for updates | Update in Drive directly |
| Privacy concerns | User controls access |
| GDPR compliance complexity | Minimal data processing |
| Slow uploads | Instant linking |
| One upload per platform | One folder for all platforms |