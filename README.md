# Case Study Generator

A full-stack web application that generates professional case studies in DOCX format based on user input through an interactive questionnaire.

## Features

- **Interactive Questionnaire**: Web-based form to collect case study information
- **Document Generation**: Creates professional DOCX documents with proper formatting
- **Cloud Storage**: Stores generated case studies in AWS S3
- **Secure Credentials**: Uses AWS Secrets Manager in production, environment variables in development
- **Label Management**: Categorize and organize case studies with custom labels
- **File Management**: Upload, download, and manage case study documents

## Architecture

### Backend (Node.js/Express)
- RESTful API for case study operations
- AWS S3 integration for file storage
- Secure credential management
- DOCX document generation
- File upload handling with Multer

### Frontend (React)
- Interactive questionnaire interface
- Case study management dashboard
- File upload/download functionality
- Responsive design

### AWS Services
- **S3**: Document storage and retrieval
- **Secrets Manager**: Secure credential storage (production)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- AWS account with S3 bucket
- AWS credentials with S3 and Secrets Manager permissions

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd case-study-generator
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

5. **Set up AWS Secrets Manager (Production)**
```bash
node scripts/setup-secrets.js
```

## Usage

### Development
```bash
# Start backend server
npm run dev

# Start frontend (in another terminal)
cd client
npm start
```

### Production
```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
NODE_ENV=production npm start
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/case-studies` - List all case studies
- `POST /api/case-studies` - Create new case study
- `GET /api/case-studies/:id` - Download case study
- `DELETE /api/case-studies/:id` - Delete case study
- `GET /api/labels` - Get available labels
- `POST /api/labels` - Create new label

## Security

- Credentials stored securely in AWS Secrets Manager (production)
- Environment variables for development
- No hardcoded secrets in source code
- IAM-based access control
- Encrypted storage in S3

## File Structure

```
case-study-generator/
├── client/                 # React frontend
├── routes/                 # Express routes
├── services/              # Business logic services
│   ├── credentialsService.js
│   ├── s3Service.js
│   ├── docxService.js
│   └── labelService.js
├── scripts/               # Utility scripts
├── server.js             # Express server
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License
