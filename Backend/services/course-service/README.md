# Course Service

Complete course management service for TechLearn LMS.

## Features

- ✅ Course CRUD (create, read, update, delete)
- ✅ Module & lesson management
- ✅ Student enrollment
- ✅ Progress tracking with automatic calculation
- ✅ Reviews & ratings
- ✅ File uploads (S3 integration)
- ✅ Categories & search
- ✅ Multiple lesson types (video, text, audio, code, quiz)
- ✅ Free preview lessons
- ✅ Course statistics

## Quick Start

### 1. Initialize Database

```bash
npm run db:init
```

This creates all tables and default categories.

### 2. Configure Environment

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://techlearn:techlearn@localhost:5432/techlearn

# Service
COURSE_SERVICE_PORT=4002

# JWT (from auth-service)
JWT_SECRET=your_jwt_secret

# Frontend
FRONTEND_URL=http://localhost:5173

# AWS S3 (for uploads)
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=techlearn-media
AWS_REGION=us-east-1
```

### 3. Run Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

The service runs on `http://localhost:4002`

## API Endpoints

### Courses

```
GET    /api/courses                    # List courses
GET    /api/courses/:id                # Get course details
POST   /api/courses                    # Create course (instructor)
PATCH  /api/courses/:id                # Update course (instructor)
DELETE /api/courses/:id                # Delete course (instructor)
PATCH  /api/courses/:id/publish        # Publish/unpublish (instructor)
GET    /api/courses/categories         # List categories
```

### Modules

```
POST   /api/courses/:courseId/modules  # Create module (instructor)
PATCH  /api/modules/:id                # Update module (instructor)
DELETE /api/modules/:id                # Delete module (instructor)
POST   /api/courses/:courseId/modules/reorder  # Reorder (instructor)
```

### Lessons

```
GET    /api/lessons/:id                          # Get lesson (enrolled)
POST   /api/lessons/modules/:moduleId/lessons    # Create (instructor)
PATCH  /api/lessons/:id                          # Update (instructor)
DELETE /api/lessons/:id                          # Delete (instructor)
POST   /api/lessons/modules/:moduleId/lessons/reorder  # Reorder (instructor)
```

### Enrollment

```
POST   /api/courses/:courseId/enroll       # Enroll in course (student)
GET    /api/my-enrollments                 # My enrollments (student)
GET    /api/courses/:courseId/enrollment   # Enrollment details (student)
DELETE /api/courses/:courseId/enrollment   # Drop enrollment (student)
GET    /api/courses/:courseId/students     # Course students (instructor)
```

### Progress

```
POST   /api/lessons/:lessonId/complete     # Mark complete (student)
GET    /api/lessons/:lessonId/progress     # Lesson progress (student)
GET    /api/courses/:courseId/progress     # Course progress (student)
GET    /api/courses/:courseId/next-lesson  # Next lesson (student)
```

### Reviews

```
GET    /api/courses/:courseId/reviews  # Get reviews (public)
POST   /api/courses/:courseId/reviews  # Create review (student)
PATCH  /api/reviews/:id                # Update review (student)
DELETE /api/reviews/:id                # Delete review (student/admin)
POST   /api/reviews/:id/respond        # Respond to review (instructor)
```

### Uploads

```
POST   /api/upload/image            # Upload image (instructor)
POST   /api/upload/video            # Upload video (instructor)
POST   /api/upload/audio            # Upload audio (instructor)
POST   /api/upload/document         # Upload document (instructor)
POST   /api/upload/presigned-url    # Get presigned URL (instructor)
```

## Database Schema

### Tables

- **courses** - Course information
- **modules** - Course sections
- **lessons** - Individual lessons
- **enrollments** - Student enrollments
- **lesson_progress** - Progress tracking
- **course_reviews** - Reviews & ratings
- **categories** - Course categories
- **course_stats** - Aggregated statistics

### Automatic Features

- Progress calculation triggers
- Statistics update triggers
- Timestamp management
- Enrollment status updates

## Authentication

All routes except public endpoints require JWT authentication.

Include token in Authorization header:

```
Authorization: Bearer <access_token>
```

## Authorization

- **Anonymous**: Browse published courses
- **Student**: Enroll, learn, review
- **Instructor**: Create/manage courses, respond to reviews
- **Admin**: Full access

## File Uploads

Supported file types:

- **Images**: JPEG, PNG, WebP, GIF (max 5MB)
- **Videos**: MP4, WebM, OGG (max 100MB)
- **Audio**: MP3, WAV, OGG (max 50MB)
- **Documents**: PDF, Word, PowerPoint (max 20MB)

Files are uploaded to S3 and public URLs returned.

## Lesson Types

1. **Video** - YouTube, Vimeo, or S3 hosted
2. **Text** - Markdown content
3. **Audio** - Audio lectures
4. **Code** - Code templates & solutions
5. **Quiz** - JSONB quiz data

## Development

### Project Structure

```
src/
├── controllers/     # Request handlers
├── routes/          # Route definitions
├── middleware/      # Auth, validation
├── validators/      # Zod schemas
├── services/        # Business logic
├── db/              # Database
└── index.ts         # Main server
```

### Adding New Features

1. Update database schema (db/schema.sql)
2. Add validation schema (validators/)
3. Create controller methods (controllers/)
4. Add routes (routes/)
5. Test with Postman/cURL

### Running Tests

```bash
# Test course creation
curl -X POST http://localhost:4002/api/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Course",
    "slug": "test-course",
    "description": "A test course",
    "skillLevel": "beginner"
  }'
```

## Monitoring

Health check endpoint:

```
GET /health

Response:
{
  "service": "course-service",
  "status": "ok"
}
```

## Error Handling

All errors return JSON:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Optional error details"]
}
```

## Performance

- All foreign keys indexed
- Pagination on list endpoints
- Eager loading for nested data
- Materialized statistics
- Connection pooling (max 20)

## Security

- JWT token verification
- Role-based access control
- SQL injection protection (parameterized queries)
- File type validation
- File size limits
- CORS enabled
- Helmet security headers

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL
docker ps | grep postgres

# Verify DATABASE_URL
echo $DATABASE_URL
```

### Upload Fails

- Verify AWS credentials in `.env`
- Check S3 bucket exists
- Verify bucket permissions

### Progress Not Updating

- Check database triggers exist
- Verify enrollment exists
- Check lesson belongs to enrolled course

## Production Checklist

- [ ] Set secure JWT_SECRET
- [ ] Configure AWS credentials
- [ ] Set up S3 bucket with CORS
- [ ] Enable database backups
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up CDN for media
- [ ] Test all endpoints

## Support

For issues or questions:
- Check the main documentation: `COURSE_SERVICE_GUIDE.md`
- Review API examples in the guide
- Check database schema in `src/db/schema.sql`

## License

Part of TechLearn LMS - Enterprise Tech Training Platform
