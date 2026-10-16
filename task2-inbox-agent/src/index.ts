
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("src"));

const PORT = Number(process.env.PORT || 3000);
const KNOWLEDGE_API_URL =
  process.env.KNOWLEDGE_API_URL || "http://127.0.0.1:8000";

type Email = {
  id: number;
  category: string;
  sender: string;
  subject: string;
  body: string;
  question: string;
};

type Review = {
  status: "approved" | "edited" | "rejected";
  finalReply?: string;
  feedback?: string;
  reviewedAt: string;
};

type Source = {
  title?: string;
  url?: string;
  link?: string;
  source?: string;
};

type KnowledgeResponse = {
  answer?: string;
  response?: string;
  sources?: Source[];
  citations?: Source[];
  needs_human?: boolean;
  needsHuman?: boolean;
};

const topics = [
  {
    category: "Website Settings",
    sender: "alex@example.com",
    subject: "How can I update website settings?",
    questions: [
      "How do I update website settings?",
      "Where can I change my website title and description?",
      "How do I update my website logo?",
      "Where can I change the website language?",
      "How can I update social media links?",
      "How do I change localization settings?",
      "Where are the general website settings?",
      "How can I configure search settings?",
      "How do I save website setting changes?",
      "How can I verify my website settings?"
    ],
    bodies: [
      "I need help finding and updating my website settings.",
      "I want to change my website title and description.",
      "Could you explain how to replace my website logo?",
      "I need to change the default language of my site.",
      "How can I update the social media links on my site?",
      "I need help setting my website's country and currency.",
      "Where can I find the general settings page?",
      "I want to change how search works on my website.",
      "I changed some settings but need help saving them.",
      "How can I confirm that my settings changes worked?"
    ]
  },
  {
    category: "Admin Accounts",
    sender: "sam@example.com",
    subject: "Managing administrator accounts",
    questions: [
      "How do I manage administrator accounts?",
      "Where can I find administrator account settings?",
      "How do I update admin account details?",
      "How can I troubleshoot administrator login problems?",
      "Where can I find documentation about admin permissions?",
      "How do I check the available administrator options?",
      "How can I get help with an admin account issue?",
      "Where can I find account management guidance?",
      "How do I review administrator settings?",
      "What documentation explains administrator management?"
    ],
    bodies: [
      "I need guidance on managing admin accounts.",
      "I cannot find the administrator account settings.",
      "I need help updating administrator account details.",
      "An administrator is having trouble logging in.",
      "Could you point me to the documentation about admin permissions?",
      "I want to understand the available administrator options.",
      "I am experiencing an issue with an admin account.",
      "Where can I find account management instructions?",
      "I need help reviewing my administrator settings.",
      "Please share the relevant administrator management documentation."
    ]
  },
  {
    category: "Website Features",
    sender: "taylor@example.com",
    subject: "Help with a website feature",
    questions: [
      "How do I configure website features?",
      "Where can I find feature setup instructions?",
      "How can I customize a website feature?",
      "What documentation explains feature configuration?",
      "How do I find the correct feature settings?",
      "Where can I get help setting up a website feature?",
      "How can I check feature configuration options?",
      "What should I do if a feature is missing?",
      "How do I find setup guides for website features?",
      "Where can I find official feature documentation?"
    ],
    bodies: [
      "Could you explain how to configure a website feature?",
      "I need the setup instructions for a website feature.",
      "I want to customize one of the features on my site.",
      "Please share documentation explaining feature configuration.",
      "I cannot find the settings for a particular feature.",
      "Can you help me set up a website feature?",
      "I need to understand the configuration options available.",
      "A feature I expected to see is missing from my site.",
      "Where can I find a guide to setting up features?",
      "Please direct me to the official feature documentation."
    ]
  },
  {
    category: "Troubleshooting",
    sender: "jordan@example.com",
    subject: "Website issue",
    questions: [
      "How do I troubleshoot a website issue?",
      "Where can I find website troubleshooting instructions?",
      "What should I check when a website feature stops working?",
      "How can I find support documentation for an error?",
      "What information should I provide about a website issue?",
      "How do I find help for an unexpected website problem?",
      "Where can I look for troubleshooting guidance?",
      "How do I check whether documentation covers my issue?",
      "What should I do if the problem continues?",
      "How can I contact support about a website issue?"
    ],
    bodies: [
      "Something is not working as expected on my website.",
      "I need instructions for troubleshooting a website issue.",
      "A feature stopped working and I need guidance.",
      "I encountered an error and need the relevant support article.",
      "Please tell me what details to provide about this issue.",
      "I am experiencing an unexpected problem on my website.",
      "Could you share the available troubleshooting guidance?",
      "I need to check whether my issue is covered by documentation.",
      "The problem continues and I need further assistance.",
      "How can I get support for this website problem?"
    ]
  },
  {
    category: "Billing",
    sender: "morgan@example.com",
    subject: "Billing support question",
    questions: [
      "What does the support documentation say about billing?",
      "Where can I find official billing support information?",
      "How can I find help with a billing question?",
      "Where can I find billing-related documentation?",
      "How do I locate the correct support guidance for billing?",
      "What should I do if I have a billing concern?",
      "Where can I find information about billing support?",
      "How can I get help with a billing issue?",
      "Which official resource should I check for billing questions?",
      "How do I contact support about a billing question?"
    ],
    bodies: [
      "I have a billing question and need the correct guidance.",
      "Could you share the official billing support information?",
      "I need help understanding a billing-related question.",
      "Please point me to the relevant billing documentation.",
      "Where can I find reliable support guidance about billing?",
      "I have a billing concern and need assistance.",
      "I need information about the available billing support resources.",
      "I am having a billing issue and need help.",
      "Which official resource should I consult for billing questions?",
      "Please let me know how to get support for billing."
    ]
  }
];

// Generate 50 varied sample emails for the inbox demo.
const emails: Email[] = Array.from({ length: 50 }, (_, index) => {
  const topic = topics[Math.floor(index / 10)];
  const variation = index % 10;

  return {
    id: index + 1,
    category: topic.category,
    sender: topic.sender,
    subject: `${topic.subject} #${index + 1}`,
    body: topic.bodies[variation],
    question: topic.questions[variation]
  };
});

const drafts = new Map<number, string>();
const draftSources = new Map<number, Source[]>();
const draftNeedsHuman = new Map<number, boolean>();
const reviews = new Map<number, Review>();
const consecutiveUnedited = new Map<string, number>();

app.get("/", (_req, res) => {
  res.json({
    message: "AI Tech Consultant - Inbox Agent",
    endpoints: [
      "/health",
      "/emails",
      "/emails/:id/draft",
      "/emails/:id/review"
    ]
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    emailCount: emails.length,
    knowledgeApiUrl: KNOWLEDGE_API_URL
  });
});

app.get("/emails", (_req, res) => {
  res.json(
    emails.map(email => ({
      ...email,
      draft: drafts.get(email.id) || null,
      sources: draftSources.get(email.id) || [],
      needsHuman: draftNeedsHuman.get(email.id) ?? false,
      review: reviews.get(email.id) || null
    }))
  );
});

app.post("/emails/:id/draft", async (req, res) => {
  const id = Number(req.params.id);
  const email = emails.find(item => item.id === id);

  if (!email) {
    return res.status(404).json({ error: "Email not found" });
  }

  try {
    const response = await fetch(`${KNOWLEDGE_API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: email.question })
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "Knowledge Brain API failed",
        status: response.status
      });
    }

    const knowledge =
      (await response.json()) as KnowledgeResponse;

    const answer = (
      knowledge.answer ||
      knowledge.response ||
      ""
    ).trim();

    const sources = (
      knowledge.sources ||
      knowledge.citations ||
      []
    ).filter(source =>
      Boolean(source.url || source.link || source.source)
    );

    const needsHuman = Boolean(
      knowledge.needs_human ?? knowledge.needsHuman
    );

    // Never invent a technical answer when the Knowledge Brain
    // does not return one. Keep the draft safe and request review.
    let reply: string;

    if (answer) {
      reply =
        `Hello,\n\n` +
        `Thank you for contacting support about "${email.subject}".\n\n` +
        `${answer}\n\n`;

      if (sources.length > 0) {
        reply +=
          "Helpful resources:\n" +
          sources
            .map(source => {
              const url = source.url || source.link || source.source;
              return `- ${source.title || "Support documentation"}: ${url}`;
            })
            .join("\n") +
          "\n\n";
      }

      if (needsHuman) {
        reply +=
          "This response requires review by our support team before " +
          "a definitive answer can be provided.\n\n";
      }

      reply +=
        "If you need further assistance, please let our support team know.\n\n" +
        "Regards,\nSupport Team";
    } else {
      reply =
        `Hello,\n\n` +
        `Thank you for contacting support about "${email.subject}".\n\n` +
        `We could not verify a suitable answer from the available support ` +
        `documentation. Our support team needs to review your question ` +
        `before providing accurate guidance.\n\n` +
        `Regards,\nSupport Team`;

      // Without a grounded answer, always require human review.
      draftNeedsHuman.set(id, true);
    }

    const finalNeedsHuman = needsHuman || !answer;

    drafts.set(id, reply);
    draftSources.set(id, sources);
    draftNeedsHuman.set(id, finalNeedsHuman);
    reviews.delete(id);

    return res.json({
      emailId: id,
      category: email.category,
      draft: reply,
      sources,
      needsHuman: finalNeedsHuman,
      requiresHumanApproval: true,
      message: finalNeedsHuman
        ? "Human review is required before using this reply."
        : "Draft generated from the Knowledge Brain. Human approval is still required."
    });
  } catch (error) {
    console.error("Draft generation failed:", error);

    return res.status(502).json({
      error:
        "Cannot connect to Knowledge Brain. Check that Task 1 is running."
    });
  }
});

app.post("/emails/:id/review", (req, res) => {
  const id = Number(req.params.id);
  const email = emails.find(item => item.id === id);

  if (!email) {
    return res.status(404).json({ error: "Email not found" });
  }

  const {
    status,
    editedReply,
    reply,
    feedback
  } = req.body as {
    status?: string;
    editedReply?: string;
    reply?: string;
    feedback?: string;
  };

  if (!["approved", "edited", "rejected"].includes(status || "")) {
    return res.status(400).json({
      error: "status must be approved, edited, or rejected"
    });
  }

  if (!drafts.has(id)) {
    return res.status(400).json({
      error: "Generate a draft before reviewing this email"
    });
  }

  // Accept both field names so the dashboard and API stay compatible.
  const submittedReply = (editedReply ?? reply ?? "").trim();

  if (status === "edited" && !submittedReply) {
    return res.status(400).json({
      error: "editedReply or reply is required for edited status"
    });
  }

  if (status === "approved" && !drafts.get(id)?.trim()) {
    return res.status(400).json({
      error: "There is no draft to approve"
    });
  }

  const finalReply =
    status === "edited"
      ? submittedReply
      : drafts.get(id);

  const review: Review = {
    status: status as Review["status"],
    finalReply: status === "rejected" ? undefined : finalReply,
    feedback: feedback || "",
    reviewedAt: new Date().toISOString()
  };

  reviews.set(id, review);

  const category = email.category;

  if (status === "approved") {
    consecutiveUnedited.set(
      category,
      (consecutiveUnedited.get(category) || 0) + 1
    );
  } else {
    consecutiveUnedited.set(category, 0);
  }

  const consecutive = consecutiveUnedited.get(category) || 0;

  return res.json({
    emailId: id,
    review,
    category,
    consecutiveUneditedApprovals: consecutive,
    autonomyEligibleForEvaluation: consecutive >= 20,
    message:
      status === "rejected"
        ? "Draft rejected and review decision recorded."
        : status === "edited"
          ? "Edited reply saved. Human review remains required."
          : "Reply approved. This records approval; it does not send an email."
  });
});

app.listen(PORT, () => {
  console.log(`Inbox Agent running at http://localhost:${PORT}`);
  console.log(`Knowledge Brain API: ${KNOWLEDGE_API_URL}`);
});
