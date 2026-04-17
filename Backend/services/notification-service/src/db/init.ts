import fs from "fs";
import path from "path";
import pool from "./pool";

/**
 * Initialize Notification service database schema
 * Run: ts-node src/db/init.ts
 */
async function initDatabase() {
  try {
    console.log("[notification-service] Initializing database schema...");

    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    await pool.query(schema);

    console.log(
      "[notification-service] ✅ Database schema initialized successfully",
    );

    // Create default notification templates
    await createDefaultTemplates();

    console.log("[notification-service] ✅ Default templates created");

    process.exit(0);
  } catch (error) {
    console.error(
      "[notification-service] ❌ Database initialization failed:",
      error,
    );
    process.exit(1);
  }
}

async function createDefaultTemplates() {
  const templates = [
    // Course Enrollment
    {
      name: "course_enrollment_email",
      type: "course_enrollment",
      channel: "email",
      subject_template: "Welcome to {{courseName}}!",
      body_template: `
        <h2>You're enrolled in {{courseName}}!</h2>
        <p>Hi {{userName}},</p>
        <p>Congratulations! You've successfully enrolled in <strong>{{courseName}}</strong>.</p>
        <p><a href="{{courseUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Learning</a></p>
        <p>Happy learning!</p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Student name", required: true },
        { name: "courseName", description: "Course title", required: true },
        { name: "courseUrl", description: "Course URL", required: true },
      ]),
      default_priority: "normal",
    },
    {
      name: "course_enrollment_in_app",
      type: "course_enrollment",
      channel: "in_app",
      body_template: "You have enrolled in {{courseName}}. Start learning now!",
      variables: JSON.stringify([
        { name: "courseName", description: "Course title", required: true },
      ]),
      default_priority: "normal",
    },

    // Lesson Completed
    {
      name: "lesson_completed_email",
      type: "lesson_completed",
      channel: "email",
      subject_template: "Lesson Complete: {{lessonName}}",
      body_template: `
        <h2>Great job, {{userName}}!</h2>
        <p>You've completed <strong>{{lessonName}}</strong> in {{courseName}}.</p>
        <p>Progress: {{completionPercent}}% complete</p>
        <p><a href="{{nextLessonUrl}}">Continue to Next Lesson →</a></p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Student name", required: true },
        { name: "lessonName", description: "Lesson title", required: true },
        { name: "courseName", description: "Course title", required: true },
        {
          name: "completionPercent",
          description: "Course progress",
          required: true,
        },
        {
          name: "nextLessonUrl",
          description: "Next lesson URL",
          required: false,
        },
      ]),
      default_priority: "low",
    },
    {
      name: "lesson_completed_in_app",
      type: "lesson_completed",
      channel: "in_app",
      body_template: "✓ Completed: {{lessonName}}. Keep going!",
      variables: JSON.stringify([
        { name: "lessonName", description: "Lesson title", required: true },
      ]),
      default_priority: "low",
    },

    // Certificate Issued
    {
      name: "certificate_issued_email",
      type: "certificate_issued",
      channel: "email",
      subject_template: "🎓 Certificate Earned: {{courseName}}",
      body_template: `
        <h2>Congratulations, {{userName}}!</h2>
        <p>You've earned a certificate for completing <strong>{{courseName}}</strong>!</p>
        <p><a href="{{certificateUrl}}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Certificate</a></p>
        <p>Share your achievement on LinkedIn and with your network!</p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Student name", required: true },
        { name: "courseName", description: "Course title", required: true },
        {
          name: "certificateUrl",
          description: "Certificate download URL",
          required: true,
        },
      ]),
      default_priority: "high",
    },

    // Review Reminder (Spaced Repetition)
    {
      name: "review_reminder_email",
      type: "spaced_repetition",
      channel: "email",
      subject_template: "Time to review: {{contentName}}",
      body_template: `
        <h2>Review Time!</h2>
        <p>Hi {{userName}},</p>
        <p>It's time to review <strong>{{contentName}}</strong> to reinforce your learning.</p>
        <p>Regular reviews help improve long-term retention.</p>
        <p><a href="{{reviewUrl}}">Start Review →</a></p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Student name", required: true },
        {
          name: "contentName",
          description: "Lesson/module name",
          required: true,
        },
        { name: "reviewUrl", description: "Review URL", required: true },
      ]),
      default_priority: "normal",
    },
    {
      name: "review_reminder_in_app",
      type: "spaced_repetition",
      channel: "in_app",
      body_template: "📚 Time to review: {{contentName}}",
      variables: JSON.stringify([
        {
          name: "contentName",
          description: "Lesson/module name",
          required: true,
        },
      ]),
      default_priority: "normal",
    },

    // Assignment Due
    {
      name: "assignment_due_email",
      type: "assignment_due",
      channel: "email",
      subject_template: "Assignment Due Soon: {{assignmentName}}",
      body_template: `
        <h2>Reminder: Assignment Due</h2>
        <p>Hi {{userName}},</p>
        <p><strong>{{assignmentName}}</strong> is due on {{dueDate}}.</p>
        <p>{{remainingTime}} remaining to submit.</p>
        <p><a href="{{assignmentUrl}}">Complete Assignment →</a></p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Student name", required: true },
        {
          name: "assignmentName",
          description: "Assignment title",
          required: true,
        },
        { name: "dueDate", description: "Due date formatted", required: true },
        {
          name: "remainingTime",
          description: 'Time remaining (e.g., "2 days")',
          required: true,
        },
        {
          name: "assignmentUrl",
          description: "Assignment URL",
          required: true,
        },
      ]),
      default_priority: "high",
    },

    // Payment Success
    {
      name: "payment_success_email",
      type: "payment_success",
      channel: "email",
      subject_template: "Payment Confirmed - {{courseName}}",
      body_template: `
        <h2>Payment Successful!</h2>
        <p>Hi {{userName}},</p>
        <p>Your payment of {{amount}} for <strong>{{courseName}}</strong> has been confirmed.</p>
        <p>Receipt #{{receiptNumber}}</p>
        <p><a href="{{invoiceUrl}}">Download Invoice</a></p>
      `,
      variables: JSON.stringify([
        { name: "userName", description: "Customer name", required: true },
        { name: "courseName", description: "Course title", required: true },
        {
          name: "amount",
          description: "Payment amount formatted",
          required: true,
        },
        {
          name: "receiptNumber",
          description: "Receipt/transaction ID",
          required: true,
        },
        { name: "invoiceUrl", description: "Invoice URL", required: true },
      ]),
      default_priority: "high",
    },
  ];

  for (const template of templates) {
    try {
      await pool.query(
        `INSERT INTO notification_templates (
          name, type, channel, subject_template, body_template, variables, default_priority
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (name, version) DO NOTHING`,
        [
          template.name,
          template.type,
          template.channel,
          template.subject_template || null,
          template.body_template,
          template.variables,
          template.default_priority,
        ],
      );
    } catch (error) {
      console.error(`Failed to create template ${template.name}:`, error);
    }
  }
}

initDatabase();
