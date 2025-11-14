# Career Mate Backend API Endpoints

## Resume Management

### Extract Text from File
**POST** `/api/extract_file_text`

Extracts text from uploaded resume files (PDF, TXT) and automatically saves it to the database.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF or TXT file)

**Response:**
```json
{
  "text": "Extracted resume text...",
  "filename": "resume.pdf",
  "message": "Text extracted and saved successfully"
}
```

**Features:**
- Supports PDF and TXT files
- Automatically saves extracted text to user's resume in database
- Returns extracted text for immediate use

### Store Resume
**POST** `/api/store_resume`

Manually store resume text.

**Request:**
```json
{
  "email": "user@example.com",
  "resume_text": "Resume content..."
}
```

### Get User Resume
**GET** `/api/get_resume`

Retrieve the most recent resume for the logged-in user.

**Query Parameters:**
- `email`: User email (optional if logged in)

**Response:**
```json
{
  "resume_text": "Stored resume content...",
  "created_at": "2024-01-01T00:00:00"
}
```

## Cover Letter Generation

### Generate Cover Letter (with manual resume)
**POST** `/api/generate_cover_letter`

Generate a cover letter from provided resume text and job description.

**Request:**
```json
{
  "resume_text": "Resume content...",
  "job_description": "Job description...",
  "name": "John Doe",
  "email": "user@example.com",
  "job_title": "Software Engineer"
}
```

**Response:**
```json
{
  "cover_letter": "Generated cover letter...",
  "cover_id": "cover_letter_id"
}
```

### Generate Cover Letter (from stored resume)
**POST** `/api/generate_cover_from_stored`

Generate a cover letter using the user's stored resume and a new job description.

**Request:**
```json
{
  "job_description": "Job description...",
  "email": "user@example.com",
  "name": "John Doe",
  "job_title": "Software Engineer"
}
```

**Response:**
```json
{
  "cover_letter": "Generated cover letter...",
  "resume_suggestions": ["Suggestion 1", "Suggestion 2"],
  "cover_id": "cover_letter_id"
}
```

**Features:**
- Uses the most recent stored resume
- Provides AI-powered resume improvement suggestions
- Automatically stores the generated cover letter

### Accept Cover Letter
**POST** `/api/accept_cover_letter`

Mark a cover letter as accepted by the user.

**Request:**
```json
{
  "cover_id": "cover_letter_id"
}
```

## Resume Analysis

### Analyze Resume
**POST** `/api/analyze_resume`

Get AI-powered analysis and suggestions for a resume.

**Request:**
```json
{
  "resume_text": "Resume content...",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "analysis": {
    "strengths": ["Strong technical skills"],
    "improvements": ["Add more quantifiable achievements"],
    "score": 85
  }
}
```

### Get AI Suggestions
**POST** `/api/get_ai_suggestions`

Get specific AI suggestions for resume sections.

**Request:**
```json
{
  "resume_text": "Resume content...",
  "section": "experience",
  "job_description": "Optional job description for tailored suggestions"
}
```

## Authentication

All endpoints require user authentication via session. The user's email is stored in the session after login.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (missing required fields)
- `404`: Resource not found
- `500`: Server error

Error responses include a descriptive message:
```json
{
  "error": "Error description"
}
```

## Notes

- The `/api/extract_file_text` endpoint now automatically saves extracted resume text to the database
- Cover letters are automatically stored when generated
- The system uses the most recent resume when generating cover letters from stored resumes
- All resume and cover letter data is associated with the user's email (hashed for security)
