# Resume Parser & Analysis Application

## Project Structure

This project is organized into two main directories:

- **frontend/**: React-based frontend application
- **backend/**: Supabase backend services and edge functions

## Frontend Setup

Navigate to the frontend directory and install dependencies:

```sh
cd frontend
npm install
npm run dev
```

## Backend Setup

Navigate to the backend directory and start Supabase:

```sh
cd backend
supabase start
```

## Features

### Resume Upload & Analysis
- Upload PDF, DOC, or DOCX resume files
- Automatic text extraction and parsing
- Extract key information:
  - Personal information (name, email, phone)
  - Professional summary
  - Work experience
  - Education
  - Skills
  - Certifications
  - Languages

### Enhanced Parsing
- Improved text extraction from various file formats
- Better pattern matching for names, contact information
- Enhanced skills detection with categorization
- Comprehensive experience and education parsing
- Intelligent scoring system

## Technologies Used

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router
- Vite

### Backend
- Supabase
- PostgreSQL
- Edge Functions (Deno)
- OpenAI API (optional for enhanced parsing)

## API Endpoints

- `POST /functions/v1/parse-resume` - Parse uploaded resume file
- `GET /functions/v1/get-resume` - Retrieve parsed resume data
- `POST /functions/v1/upload-resume` - Upload resume file (authenticated)

## Environment Variables

### Backend
- `OPENAI_API_KEY` - Optional, for enhanced AI-powered parsing
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Development

### Frontend Development
```sh
cd frontend
npm run dev
```

### Backend Development
```sh
cd backend
supabase functions serve
```

## Deployment

### Frontend
```sh
cd frontend
npm run build
```

### Backend
```sh
cd backend
supabase functions deploy
```

## Recent Improvements

1. **Enhanced Resume Parsing**
   - Better text extraction from PDF files
   - Improved name detection with multiple patterns
   - Enhanced skills extraction with broader keyword matching
   - Better experience and education parsing
   - More accurate company and position extraction

2. **Simplified UI**
   - Removed location, LinkedIn, and website fields
   - Removed AI resume builder section
   - Focused on core resume analysis functionality

3. **Project Structure**
   - Separated frontend and backend into distinct directories
   - Improved organization and maintainability

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request