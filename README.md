# Case Study Generator

A comprehensive web application for creating, managing, and publishing professional case studies with integrated review workflows and document generation capabilities.

## Features Overview

### 📝 Case Study Creation
- **Rich Form Interface**: Comprehensive form with sections for overview, challenge, solution, results, and metrics
- **File Upload Support**: Upload architecture diagrams and implementation workstream diagrams (PNG, JPG, GIF, SVG, PDF)
- **Custom Metrics**: Add custom performance metrics beyond standard KPIs
- **Label System**: Categorize case studies with customizable labels (client, sector, technology, etc.)
- **Architecture Diagrams**: Multiple architecture sections with descriptions and diagram uploads
- **Implementation Workstreams**: Define workstreams with associated diagrams and descriptions

### 💾 Draft Management System
- **Save as Draft**: Save incomplete case studies for later completion
- **Auto-save**: Preserve work without losing progress
- **Edit Drafts**: Continue working on saved drafts with all content preserved
- **Draft Status Tracking**: Monitor draft creation and modification dates
- **File Preservation**: All uploaded diagrams maintained across draft sessions

### 📋 Review Workflow

#### Draft Submission
- **Direct Submit**: Submit completed case studies directly for review
- **Draft to Review**: Convert saved drafts to review status
- **Validation**: Ensure all required fields are completed before submission

#### Review Process
- **Review Dashboard**: Dedicated interface for reviewers to manage submissions
- **Detailed Review**: View complete case study content including diagrams
- **Feedback System**: Add comments and feedback for authors
- **Approval/Rejection**: Binary decision with feedback capability
- **Review History**: Track all review decisions and comments

### 📊 Status Management
Case studies progress through defined statuses:
- **Draft**: Work in progress, editable by author
- **Under Review**: Submitted for review, awaiting reviewer decision
- **Approved**: Accepted by reviewer, ready for publication
- **Rejected**: Declined by reviewer, returned to author with feedback
- **Published**: Live and discoverable in the system

### 📄 Document Generation
- **DOCX Export**: Generate professional Word documents
- **One-Pager**: Create executive summary versions
- **Image Embedding**: Automatically embed uploaded diagrams in documents
- **Professional Formatting**: Consistent styling and layout
- **Preview Mode**: HTML preview before document generation

### 🏷️ Label Management System
- **Dynamic Categories**: Create custom label categories (client, sector, technology, etc.)
- **Value Management**: Add, edit, and delete values within categories
- **Category Operations**: Rename or delete entire categories
- **Real-time Updates**: Changes immediately available for case study creation
- **Bulk Operations**: Manage multiple labels efficiently

## Workflows

### 1. Draft Creation Workflow

```
User Creates Case Study
├── Fill Basic Information (title, duration, team size, etc.)
├── Add Content Sections (overview, challenge, solution, results)
├── Upload Architecture Diagrams
├── Define Implementation Workstreams
├── Add Custom Metrics and Labels
└── Choose Action:
    ├── Save as Draft → Continue Later
    └── Submit for Review → Review Workflow
```

### 2. Draft Management Workflow

```
Draft Saved
├── Appears in "Manage Case Studies" page
├── Status: "Draft"
├── Actions Available:
│   ├── Edit → Resume editing
│   ├── Delete → Remove draft
│   └── Submit for Review → Move to review
└── All content preserved:
    ├── Form data maintained
    ├── Uploaded files preserved
    └── Labels and metrics saved
```

### 3. Review Workflow

```
Case Study Submitted for Review
├── Status: "Under Review"
├── Appears in Reviewer Dashboard
├── Reviewer Actions:
│   ├── View Complete Content
│   ├── Review Diagrams and Documents
│   ├── Add Feedback/Comments
│   └── Make Decision:
│       ├── Approve → Status: "Approved"
│       └── Reject → Status: "Rejected" + Feedback
└── Author Notifications:
    ├── Approval → Can publish
    └── Rejection → Can incorporate feedback
```

### 4. Publication Workflow

```
Approved Case Study
├── Status: "Approved"
├── Author Actions:
│   ├── Review Final Content
│   ├── Generate Documents (DOCX, One-Pager)
│   └── Publish → Status: "Published"
└── Published Case Study:
    ├── Discoverable in system
    ├── Browsable by users
    ├── Available for download
    └── Searchable by labels
```

### 5. Feedback Incorporation Workflow

```
Rejected Case Study
├── Status: "Rejected"
├── Feedback Available
├── Author Actions:
│   ├── View Reviewer Feedback
│   ├── Incorporate Feedback → Edit Mode
│   ├── Make Required Changes
│   └── Resubmit for Review
└── Returns to Review Workflow
```

## Status Transitions

```
Draft → Under Review → Approved → Published
  ↑         ↓           ↓
  └─── Rejected ←───────┘
         ↓
    Incorporate Feedback
         ↓
      Edit Draft
```

## Label Management

### Accessing Label Management
1. Navigate to "Manage Labels" from main menu
2. View all existing label categories and values
3. Perform management operations

### Category Management
- **Create Category**: Add new label categories (e.g., "Industry", "Region")
- **Rename Category**: Update category names
- **Delete Category**: Remove categories and all associated values
- **View Statistics**: See total categories and values

### Value Management
- **Add Values**: Add new values to existing categories
- **Edit Values**: Modify existing label values
- **Delete Values**: Remove specific values from categories
- **Bulk Operations**: Manage multiple values efficiently

### Label Usage
- **Case Study Creation**: Select from available labels during creation
- **Filtering**: Use labels to filter and search case studies
- **Organization**: Categorize case studies for better discoverability
- **Reporting**: Generate reports based on label categories

## Key Features

### File Management
- **Multiple Formats**: Support for images (PNG, JPG, GIF, SVG) and PDFs
- **Secure Storage**: Files stored in AWS S3 with proper access controls
- **Preview Support**: Image preview in web interface
- **Document Embedding**: Automatic embedding in generated documents

### User Interface
- **Responsive Design**: Works on desktop and mobile devices
- **Intuitive Navigation**: Clear menu structure and workflows
- **Real-time Feedback**: Immediate validation and error messages
- **Professional Styling**: Clean, modern interface design

### Data Management
- **Persistent Storage**: All data securely stored and backed up
- **Version Control**: Track changes and modifications
- **Export Capabilities**: Generate documents in multiple formats
- **Search and Filter**: Find case studies by various criteria

### Security and Access
- **Role-based Access**: Different permissions for authors and reviewers
- **Secure File Handling**: Protected file uploads and downloads
- **Data Validation**: Input validation and sanitization
- **Audit Trail**: Track all actions and changes

## Getting Started

1. **Create Account**: Set up user account with appropriate permissions
2. **Explore Labels**: Review available label categories in "Manage Labels"
3. **Create First Case Study**: Use the creation form to build your case study
4. **Save as Draft**: Save work in progress for later completion
5. **Submit for Review**: Send completed case studies for approval
6. **Manage Content**: Use "Manage Case Studies" to track all your work

## Technical Architecture

- **Frontend**: React.js with responsive design
- **Backend**: Node.js with Express framework
- **Storage**: AWS S3 for file storage
- **Documents**: DOCX generation with image embedding
- **Database**: JSON-based data storage with S3 integration

## Support and Documentation

For additional help and detailed documentation, refer to the application's built-in help system and contact your system administrator for technical support.
