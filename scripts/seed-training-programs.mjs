import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWZ0d2htc2tjdmxqbGZ2aGpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTEzMTQyMCwiZXhwIjoyMDc2NzA3NDIwfQ.JIuESOLvrEv2tzxcC59IZbKdbNdOvXx-D34Vkl-lu5o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get random date in range
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to get date N days from now
function getDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Get PESO admin user ID (first PESO user)
async function getPesoAdminId() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'PESO')
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error fetching PESO admin:', error);
    return null;
  }

  return data.id;
}

const trainingPrograms = [
  // ========== TECH & IT (15 programs) ==========
  {
    title: "Full-Stack Web Development Bootcamp",
    description: "Comprehensive training covering HTML, CSS, JavaScript, React, Node.js, and PostgreSQL. Build real-world web applications from scratch.",
    duration: "3 months",
    schedule: "Mon-Fri, 2:00 PM - 6:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 201",
    start_date: getDaysFromNow(15),
    end_date: getDaysFromNow(105),
    skills_covered: ["HTML", "CSS", "JavaScript", "React", "Node.js", "PostgreSQL", "Git"],
    icon: "code",
    status: "active"
  },
  {
    title: "Mobile App Development with Flutter",
    description: "Learn to build cross-platform mobile applications for iOS and Android using Flutter and Dart.",
    duration: "2 months",
    schedule: "Tue-Thu, 6:00 PM - 9:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 202",
    start_date: getDaysFromNow(20),
    end_date: getDaysFromNow(80),
    skills_covered: ["Flutter", "Dart", "Mobile UI", "API Integration", "Firebase"],
    icon: "laptop",
    status: "active"
  },
  {
    title: "Data Analysis with Python",
    description: "Master data analysis using Python, Pandas, NumPy, and data visualization libraries. Learn to extract insights from data.",
    duration: "6 weeks",
    schedule: "Mon-Wed-Fri, 9:00 AM - 12:00 PM",
    capacity: 30,
    location: "PESO Training Center - Room 203",
    start_date: getDaysFromNow(10),
    end_date: getDaysFromNow(52),
    skills_covered: ["Python", "Pandas", "NumPy", "Matplotlib", "Data Visualization"],
    icon: "chart",
    status: "active"
  },
  {
    title: "Cybersecurity Fundamentals",
    description: "Introduction to cybersecurity concepts, network security, ethical hacking basics, and security best practices.",
    duration: "8 weeks",
    schedule: "Sat-Sun, 1:00 PM - 5:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 201",
    start_date: getDaysFromNow(30),
    end_date: getDaysFromNow(86),
    skills_covered: ["Network Security", "Ethical Hacking", "Encryption", "Security Tools"],
    icon: "wrench",
    status: "upcoming"
  },
  {
    title: "Cloud Computing Basics (AWS)",
    description: "Learn cloud computing fundamentals using Amazon Web Services. Cover EC2, S3, databases, and deployment.",
    duration: "4 weeks",
    schedule: "Mon-Fri, 10:00 AM - 1:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 204",
    start_date: getDaysFromNow(45),
    end_date: getDaysFromNow(73),
    skills_covered: ["AWS", "Cloud Infrastructure", "EC2", "S3", "Cloud Deployment"],
    icon: "code",
    status: "upcoming"
  },
  {
    title: "Database Management & SQL",
    description: "Master relational databases, SQL queries, database design, optimization, and administration.",
    duration: "5 weeks",
    schedule: "Tue-Thu, 3:00 PM - 6:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 201",
    start_date: getDaysFromNow(5),
    end_date: getDaysFromNow(40),
    skills_covered: ["SQL", "PostgreSQL", "Database Design", "Query Optimization"],
    icon: "code",
    status: "active"
  },
  {
    title: "UI/UX Design Fundamentals",
    description: "Learn user interface and user experience design principles, wireframing, prototyping, and design tools.",
    duration: "6 weeks",
    schedule: "Mon-Wed-Fri, 2:00 PM - 5:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 202",
    start_date: getDaysFromNow(-15),
    end_date: getDaysFromNow(27),
    skills_covered: ["Figma", "Wireframing", "Prototyping", "User Research", "Design Thinking"],
    icon: "palette",
    status: "active"
  },
  {
    title: "WordPress Website Development",
    description: "Build professional websites using WordPress. Learn themes, plugins, customization, and SEO basics.",
    duration: "4 weeks",
    schedule: "Sat, 9:00 AM - 5:00 PM",
    capacity: 30,
    location: "PESO Training Center - Room 203",
    start_date: getDaysFromNow(-60),
    end_date: getDaysFromNow(-32),
    skills_covered: ["WordPress", "PHP", "CSS", "SEO", "Website Design"],
    icon: "code",
    status: "completed"
  },
  {
    title: "Excel & Data Visualization",
    description: "Advanced Excel skills including formulas, pivot tables, macros, and data visualization techniques.",
    duration: "3 weeks",
    schedule: "Tue-Thu, 9:00 AM - 12:00 PM",
    capacity: 35,
    location: "PESO Training Center - Room 204",
    start_date: getDaysFromNow(-45),
    end_date: getDaysFromNow(-24),
    skills_covered: ["Excel", "Formulas", "Pivot Tables", "Macros", "Charts"],
    icon: "chart",
    status: "completed"
  },
  {
    title: "Digital Literacy for Beginners",
    description: "Basic computer skills, internet browsing, email, Microsoft Office, and online safety for beginners.",
    duration: "2 weeks",
    schedule: "Mon-Fri, 9:00 AM - 12:00 PM",
    capacity: 40,
    location: "PESO Training Center - Room 101",
    start_date: getDaysFromNow(8),
    end_date: getDaysFromNow(22),
    skills_covered: ["Computer Basics", "Microsoft Office", "Internet", "Email", "Online Safety"],
    icon: "laptop",
    status: "active"
  },
  {
    title: "Artificial Intelligence & Machine Learning Introduction",
    description: "Introduction to AI and ML concepts, Python for ML, and building simple AI models.",
    duration: "10 weeks",
    schedule: "Sat-Sun, 9:00 AM - 1:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 201",
    start_date: getDaysFromNow(60),
    end_date: getDaysFromNow(130),
    skills_covered: ["Python", "Machine Learning", "TensorFlow", "Neural Networks", "AI Basics"],
    icon: "lightbulb",
    status: "upcoming"
  },
  {
    title: "Network Administration",
    description: "Learn network setup, configuration, troubleshooting, and administration for small to medium businesses.",
    duration: "8 weeks",
    schedule: "Mon-Wed-Fri, 3:00 PM - 6:00 PM",
    capacity: 15,
    location: "PESO Training Center - Room 202",
    start_date: getDaysFromNow(12),
    end_date: getDaysFromNow(68),
    skills_covered: ["Networking", "Router Configuration", "Network Security", "Troubleshooting"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Software Testing & QA",
    description: "Quality assurance fundamentals, manual testing, automation basics, and bug reporting.",
    duration: "6 weeks",
    schedule: "Tue-Thu, 1:00 PM - 4:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 203",
    start_date: getDaysFromNow(25),
    end_date: getDaysFromNow(67),
    skills_covered: ["Manual Testing", "Test Automation", "Bug Reporting", "QA Tools"],
    icon: "code",
    status: "cancelled"
  },
  {
    title: "E-commerce Platform Setup",
    description: "Learn to set up and manage online stores using Shopify, WooCommerce, and payment gateways.",
    duration: "4 weeks",
    schedule: "Mon-Fri, 1:00 PM - 4:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 204",
    start_date: getDaysFromNow(18),
    end_date: getDaysFromNow(46),
    skills_covered: ["Shopify", "WooCommerce", "Payment Gateways", "Product Management"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "IT Support Technician",
    description: "Computer hardware, software troubleshooting, help desk skills, and customer service for IT support.",
    duration: "6 weeks",
    schedule: "Mon-Fri, 9:00 AM - 12:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 101",
    start_date: getDaysFromNow(7),
    end_date: getDaysFromNow(49),
    skills_covered: ["Hardware Repair", "Software Troubleshooting", "Help Desk", "Customer Service"],
    icon: "wrench",
    status: "active"
  },

  // ========== BUSINESS & ENTREPRENEURSHIP (10 programs) ==========
  {
    title: "Entrepreneurship Basics",
    description: "Learn how to start and run a business, business planning, marketing, and financial management.",
    duration: "5 weeks",
    schedule: "Wed-Fri, 2:00 PM - 5:00 PM",
    capacity: 30,
    location: "PESO Training Center - Room 301",
    start_date: getDaysFromNow(10),
    end_date: getDaysFromNow(45),
    skills_covered: ["Business Planning", "Marketing", "Financial Management", "Legal Basics"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Digital Marketing Mastery",
    description: "Social media marketing, SEO, Google Ads, email marketing, and analytics for online business growth.",
    duration: "8 weeks",
    schedule: "Tue-Thu, 6:00 PM - 9:00 PM",
    capacity: 30,
    location: "PESO Training Center - Room 302",
    start_date: getDaysFromNow(5),
    end_date: getDaysFromNow(61),
    skills_covered: ["SEO", "Social Media", "Google Ads", "Email Marketing", "Analytics"],
    icon: "chart",
    status: "active"
  },
  {
    title: "Social Media Management",
    description: "Manage social media accounts, create content, engage audiences, and grow online presence for businesses.",
    duration: "4 weeks",
    schedule: "Mon-Wed, 3:00 PM - 6:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 301",
    start_date: getDaysFromNow(-10),
    end_date: getDaysFromNow(18),
    skills_covered: ["Content Creation", "Facebook", "Instagram", "TikTok", "Engagement"],
    icon: "palette",
    status: "active"
  },
  {
    title: "Basic Accounting & Bookkeeping",
    description: "Fundamental accounting principles, bookkeeping, financial statements, and accounting software.",
    duration: "6 weeks",
    schedule: "Sat, 9:00 AM - 5:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 302",
    start_date: getDaysFromNow(-50),
    end_date: getDaysFromNow(-8),
    skills_covered: ["Accounting Basics", "Bookkeeping", "QuickBooks", "Financial Statements"],
    icon: "chart",
    status: "completed"
  },
  {
    title: "Business Plan Writing",
    description: "How to write comprehensive business plans for startups, loans, and investor pitches.",
    duration: "3 weeks",
    schedule: "Mon-Fri, 1:00 PM - 4:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 301",
    start_date: getDaysFromNow(35),
    end_date: getDaysFromNow(56),
    skills_covered: ["Business Planning", "Financial Projections", "Market Research", "Pitch Deck"],
    icon: "book",
    status: "upcoming"
  },
  {
    title: "Customer Service Excellence",
    description: "Professional customer service skills, communication, conflict resolution, and customer satisfaction.",
    duration: "2 weeks",
    schedule: "Tue-Thu, 9:00 AM - 12:00 PM",
    capacity: 35,
    location: "PESO Training Center - Room 303",
    start_date: getDaysFromNow(14),
    end_date: getDaysFromNow(28),
    skills_covered: ["Communication", "Conflict Resolution", "Customer Satisfaction", "Phone Etiquette"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Sales Techniques & Strategies",
    description: "Effective sales techniques, negotiation skills, closing deals, and building customer relationships.",
    duration: "4 weeks",
    schedule: "Wed-Fri, 2:00 PM - 5:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 301",
    start_date: getDaysFromNow(22),
    end_date: getDaysFromNow(50),
    skills_covered: ["Sales Techniques", "Negotiation", "Closing", "CRM"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Project Management Fundamentals",
    description: "Project planning, execution, monitoring, risk management, and team leadership skills.",
    duration: "6 weeks",
    schedule: "Sat-Sun, 9:00 AM - 1:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 302",
    start_date: getDaysFromNow(-55),
    end_date: getDaysFromNow(-13),
    skills_covered: ["Project Planning", "Risk Management", "Team Leadership", "Agile", "Scrum"],
    icon: "briefcase",
    status: "completed"
  },
  {
    title: "HR Management Basics",
    description: "Human resource management, recruitment, employee relations, and payroll basics.",
    duration: "5 weeks",
    schedule: "Mon-Wed, 6:00 PM - 9:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 303",
    start_date: getDaysFromNow(40),
    end_date: getDaysFromNow(75),
    skills_covered: ["Recruitment", "Employee Relations", "Payroll", "HR Compliance"],
    icon: "briefcase",
    status: "cancelled"
  },
  {
    title: "Financial Literacy & Money Management",
    description: "Personal and business finance, budgeting, saving, investing, and financial planning.",
    duration: "3 weeks",
    schedule: "Tue-Thu, 1:00 PM - 4:00 PM",
    capacity: 30,
    location: "PESO Training Center - Room 301",
    start_date: getDaysFromNow(16),
    end_date: getDaysFromNow(37),
    skills_covered: ["Budgeting", "Saving", "Investing", "Financial Planning"],
    icon: "chart",
    status: "active"
  },

  // ========== TRADES & TECHNICAL (10 programs) ==========
  {
    title: "Basic Welding",
    description: "Arc welding, MIG, TIG welding techniques, safety practices, and metalwork fundamentals.",
    duration: "8 weeks",
    schedule: "Mon-Fri, 8:00 AM - 12:00 PM",
    capacity: 15,
    location: "PESO Workshop - Building A",
    start_date: getDaysFromNow(20),
    end_date: getDaysFromNow(76),
    skills_covered: ["Arc Welding", "MIG Welding", "TIG Welding", "Safety", "Metal Fabrication"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Electrical Installation & Wiring",
    description: "Residential and commercial electrical installation, wiring, troubleshooting, and safety codes.",
    duration: "10 weeks",
    schedule: "Mon-Wed-Fri, 1:00 PM - 5:00 PM",
    capacity: 20,
    location: "PESO Workshop - Building B",
    start_date: getDaysFromNow(12),
    end_date: getDaysFromNow(82),
    skills_covered: ["Electrical Wiring", "Installation", "Troubleshooting", "Safety Codes"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Plumbing Fundamentals",
    description: "Pipe fitting, installation, repair, drainage systems, and plumbing tools and techniques.",
    duration: "6 weeks",
    schedule: "Tue-Thu, 8:00 AM - 12:00 PM",
    capacity: 15,
    location: "PESO Workshop - Building C",
    start_date: getDaysFromNow(-48),
    end_date: getDaysFromNow(-6),
    skills_covered: ["Pipe Fitting", "Installation", "Repair", "Drainage Systems"],
    icon: "wrench",
    status: "completed"
  },
  {
    title: "Automotive Mechanics",
    description: "Car engine basics, maintenance, diagnostics, repair techniques, and automotive tools.",
    duration: "12 weeks",
    schedule: "Mon-Fri, 8:00 AM - 12:00 PM",
    capacity: 20,
    location: "PESO Workshop - Building D",
    start_date: getDaysFromNow(8),
    end_date: getDaysFromNow(92),
    skills_covered: ["Engine Repair", "Diagnostics", "Maintenance", "Tools", "Auto Electrical"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Air Conditioning & Refrigeration Repair",
    description: "AC installation, maintenance, repair, refrigeration systems, and troubleshooting.",
    duration: "8 weeks",
    schedule: "Sat-Sun, 8:00 AM - 4:00 PM",
    capacity: 15,
    location: "PESO Workshop - Building B",
    start_date: getDaysFromNow(50),
    end_date: getDaysFromNow(106),
    skills_covered: ["AC Installation", "Repair", "Refrigeration", "Troubleshooting"],
    icon: "wrench",
    status: "upcoming"
  },
  {
    title: "Carpentry & Furniture Making",
    description: "Woodworking, furniture construction, joinery, finishing, and power tool operation.",
    duration: "10 weeks",
    schedule: "Mon-Wed-Fri, 8:00 AM - 12:00 PM",
    capacity: 15,
    location: "PESO Workshop - Building A",
    start_date: getDaysFromNow(25),
    end_date: getDaysFromNow(95),
    skills_covered: ["Woodworking", "Joinery", "Furniture Making", "Power Tools", "Finishing"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Masonry & Tile Setting",
    description: "Bricklaying, concrete work, tile installation, grouting, and surface preparation.",
    duration: "6 weeks",
    schedule: "Mon-Fri, 8:00 AM - 12:00 PM",
    capacity: 20,
    location: "PESO Workshop - Building C",
    start_date: getDaysFromNow(-52),
    end_date: getDaysFromNow(-10),
    skills_covered: ["Bricklaying", "Concrete", "Tile Setting", "Grouting"],
    icon: "wrench",
    status: "completed"
  },
  {
    title: "Electronics Repair & Troubleshooting",
    description: "Electronic device repair, circuit troubleshooting, soldering, and component replacement.",
    duration: "8 weeks",
    schedule: "Tue-Thu, 1:00 PM - 5:00 PM",
    capacity: 20,
    location: "PESO Workshop - Building B",
    start_date: getDaysFromNow(18),
    end_date: getDaysFromNow(74),
    skills_covered: ["Circuit Repair", "Soldering", "Troubleshooting", "Component Testing"],
    icon: "wrench",
    status: "active"
  },
  {
    title: "Small Engine Repair",
    description: "Repair and maintenance of lawn mowers, generators, chainsaws, and other small engines.",
    duration: "5 weeks",
    schedule: "Sat, 8:00 AM - 4:00 PM",
    capacity: 15,
    location: "PESO Workshop - Building D",
    start_date: getDaysFromNow(30),
    end_date: getDaysFromNow(65),
    skills_covered: ["Engine Diagnostics", "Repair", "Maintenance", "Carburetor"],
    icon: "wrench",
    status: "cancelled"
  },
  {
    title: "Building Electrical Wiring (NCII)",
    description: "TESDA-accredited electrical wiring course for NC II certification and employment.",
    duration: "3 months",
    schedule: "Mon-Fri, 8:00 AM - 5:00 PM",
    capacity: 25,
    location: "PESO Workshop - Building B",
    start_date: getDaysFromNow(60),
    end_date: getDaysFromNow(150),
    skills_covered: ["Electrical Systems", "Wiring", "Installation", "TESDA NC II"],
    icon: "wrench",
    status: "upcoming"
  },

  // ========== CREATIVE & MEDIA (8 programs) ==========
  {
    title: "Graphic Design with Photoshop & Illustrator",
    description: "Adobe Photoshop and Illustrator for graphic design, photo editing, and digital artwork creation.",
    duration: "6 weeks",
    schedule: "Mon-Wed-Fri, 2:00 PM - 5:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 401",
    start_date: getDaysFromNow(15),
    end_date: getDaysFromNow(57),
    skills_covered: ["Photoshop", "Illustrator", "Photo Editing", "Digital Art", "Design Principles"],
    icon: "palette",
    status: "active"
  },
  {
    title: "Video Editing & Production",
    description: "Video editing using Adobe Premiere Pro and DaVinci Resolve, color grading, and storytelling.",
    duration: "8 weeks",
    schedule: "Tue-Thu, 6:00 PM - 9:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 402",
    start_date: getDaysFromNow(10),
    end_date: getDaysFromNow(66),
    skills_covered: ["Premiere Pro", "DaVinci Resolve", "Color Grading", "Transitions", "Audio"],
    icon: "palette",
    status: "active"
  },
  {
    title: "Photography Basics",
    description: "Camera operation, composition, lighting, and photo editing for professional photography.",
    duration: "4 weeks",
    schedule: "Sat-Sun, 9:00 AM - 1:00 PM",
    capacity: 15,
    location: "PESO Training Center - Room 403",
    start_date: getDaysFromNow(-35),
    end_date: getDaysFromNow(3),
    skills_covered: ["Camera Settings", "Composition", "Lighting", "Photo Editing", "Portraiture"],
    icon: "palette",
    status: "completed"
  },
  {
    title: "Content Writing & Copywriting",
    description: "Writing for websites, blogs, social media, and marketing. SEO writing and storytelling techniques.",
    duration: "5 weeks",
    schedule: "Mon-Wed, 3:00 PM - 6:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 401",
    start_date: getDaysFromNow(20),
    end_date: getDaysFromNow(55),
    skills_covered: ["Content Writing", "Copywriting", "SEO Writing", "Blogging", "Storytelling"],
    icon: "book",
    status: "active"
  },
  {
    title: "Logo Design & Branding",
    description: "Create professional logos and brand identities using design principles and industry tools.",
    duration: "4 weeks",
    schedule: "Tue-Thu, 2:00 PM - 5:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 402",
    start_date: getDaysFromNow(45),
    end_date: getDaysFromNow(73),
    skills_covered: ["Logo Design", "Branding", "Color Theory", "Typography", "Brand Identity"],
    icon: "palette",
    status: "upcoming"
  },
  {
    title: "Animation Fundamentals",
    description: "2D animation basics, character design, storyboarding, and animation software.",
    duration: "8 weeks",
    schedule: "Sat, 9:00 AM - 5:00 PM",
    capacity: 15,
    location: "PESO Training Center - Room 403",
    start_date: getDaysFromNow(35),
    end_date: getDaysFromNow(91),
    skills_covered: ["2D Animation", "Character Design", "Storyboarding", "After Effects"],
    icon: "palette",
    status: "cancelled"
  },
  {
    title: "Podcasting & Audio Production",
    description: "Start and produce podcasts, audio editing, equipment setup, and distribution strategies.",
    duration: "3 weeks",
    schedule: "Wed-Fri, 6:00 PM - 9:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 404",
    start_date: getDaysFromNow(22),
    end_date: getDaysFromNow(43),
    skills_covered: ["Podcasting", "Audio Editing", "Audacity", "Distribution", "Interviewing"],
    icon: "palette",
    status: "active"
  },
  {
    title: "Digital Illustration & Character Design",
    description: "Digital drawing and illustration techniques, character creation, and storytelling through art.",
    duration: "6 weeks",
    schedule: "Sat-Sun, 1:00 PM - 5:00 PM",
    capacity: 15,
    location: "PESO Training Center - Room 401",
    start_date: getDaysFromNow(55),
    end_date: getDaysFromNow(97),
    skills_covered: ["Digital Drawing", "Character Design", "Procreate", "Illustration", "Concept Art"],
    icon: "palette",
    status: "upcoming"
  },

  // ========== HOSPITALITY & FOOD (7 programs) ==========
  {
    title: "Food Safety & Handling (ServSafe)",
    description: "Food safety certification, proper handling, storage, sanitation, and health regulations.",
    duration: "1 week",
    schedule: "Mon-Fri, 9:00 AM - 3:00 PM",
    capacity: 30,
    location: "PESO Training Center - Kitchen Lab",
    start_date: getDaysFromNow(-20),
    end_date: getDaysFromNow(-15),
    skills_covered: ["Food Safety", "Sanitation", "Storage", "Health Regulations"],
    icon: "briefcase",
    status: "completed"
  },
  {
    title: "Barista Training & Coffee Art",
    description: "Espresso preparation, latte art, coffee brewing methods, and customer service for coffee shops.",
    duration: "2 weeks",
    schedule: "Tue-Thu, 2:00 PM - 6:00 PM",
    capacity: 15,
    location: "PESO Training Center - Barista Lab",
    start_date: getDaysFromNow(12),
    end_date: getDaysFromNow(26),
    skills_covered: ["Espresso Making", "Latte Art", "Coffee Brewing", "Customer Service"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Bread & Pastry Production",
    description: "Baking techniques, bread making, pastry creation, cake decoration, and food presentation.",
    duration: "6 weeks",
    schedule: "Mon-Wed-Fri, 8:00 AM - 12:00 PM",
    capacity: 20,
    location: "PESO Training Center - Baking Lab",
    start_date: getDaysFromNow(18),
    end_date: getDaysFromNow(60),
    skills_covered: ["Baking", "Bread Making", "Pastries", "Cake Decoration"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Basic Cooking & Culinary Skills",
    description: "Fundamental cooking techniques, knife skills, recipe following, and meal preparation.",
    duration: "4 weeks",
    schedule: "Tue-Thu, 1:00 PM - 5:00 PM",
    capacity: 20,
    location: "PESO Training Center - Kitchen Lab",
    start_date: getDaysFromNow(-40),
    end_date: getDaysFromNow(-12),
    skills_covered: ["Cooking Techniques", "Knife Skills", "Recipes", "Food Prep"],
    icon: "briefcase",
    status: "completed"
  },
  {
    title: "Hotel & Restaurant Management",
    description: "Hospitality management, front desk operations, reservations, and guest services.",
    duration: "8 weeks",
    schedule: "Mon-Fri, 1:00 PM - 4:00 PM",
    capacity: 25,
    location: "PESO Training Center - Room 501",
    start_date: getDaysFromNow(40),
    end_date: getDaysFromNow(96),
    skills_covered: ["Front Desk", "Reservations", "Guest Services", "Management"],
    icon: "briefcase",
    status: "upcoming"
  },
  {
    title: "Professional Bartending",
    description: "Mixology, cocktail creation, bar management, customer service, and responsible alcohol service.",
    duration: "3 weeks",
    schedule: "Wed-Fri, 6:00 PM - 9:00 PM",
    capacity: 15,
    location: "PESO Training Center - Bar Lab",
    start_date: getDaysFromNow(25),
    end_date: getDaysFromNow(46),
    skills_covered: ["Mixology", "Cocktails", "Bar Management", "Customer Service"],
    icon: "briefcase",
    status: "active"
  },
  {
    title: "Tourism & Tour Guiding",
    description: "Tour guide certification, local history, customer service, and tourism management.",
    duration: "4 weeks",
    schedule: "Sat-Sun, 9:00 AM - 3:00 PM",
    capacity: 20,
    location: "PESO Training Center - Room 502",
    start_date: getDaysFromNow(-80),
    end_date: getDaysFromNow(-52),
    skills_covered: ["Tour Guiding", "Local History", "Customer Service", "Tourism"],
    icon: "briefcase",
    status: "archived"
  },
];

async function seedTrainingPrograms() {
  console.log('🌱 Starting to seed 50 training programs...\n');

  const pesoAdminId = await getPesoAdminId();

  if (!pesoAdminId) {
    console.error('❌ No PESO admin found. Please create a PESO user first.');
    return;
  }

  console.log(`✅ Using PESO admin ID: ${pesoAdminId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const program of trainingPrograms) {
    const programData = {
      ...program,
      created_by: pesoAdminId,
    };

    const { data, error } = await supabase
      .from('training_programs')
      .insert([programData])
      .select();

    if (error) {
      console.error(`❌ Error inserting "${program.title}":`, error.message);
      errorCount++;
    } else {
      console.log(`✅ Inserted: ${program.title} (${program.status})`);
      successCount++;
    }
  }

  console.log(`\n📊 Seeding complete!`);
  console.log(`   ✅ Success: ${successCount} programs`);
  console.log(`   ❌ Errors: ${errorCount} programs`);
  console.log(`\n📈 Distribution by status:`);

  const statusCounts = trainingPrograms.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status}: ${count} programs`);
  });
}

// Run the seed function
seedTrainingPrograms();
