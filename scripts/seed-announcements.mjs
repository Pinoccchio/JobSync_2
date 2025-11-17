import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = 'https://ajmftwhmskcvljlfvhjf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAnnouncements() {
  console.log('🌱 Seeding 50 test announcements...\n');

  try {
    // Step 1: Get Christmas announcement image URL
    const { data: christmasAnnouncement, error: christmasError } = await supabase
      .from('announcements')
      .select('image_url, created_by')
      .ilike('title', '%Christmas%')
      .limit(1)
      .single();

    if (christmasError) {
      console.error('❌ Error fetching Christmas announcement:', christmasError);
      return;
    }

    const imageUrl = christmasAnnouncement?.image_url;
    const hrUserId = christmasAnnouncement?.created_by;

    console.log(`✅ Found Christmas image: ${imageUrl}`);
    console.log(`✅ Using HR user ID: ${hrUserId}\n`);

    // Step 2: Generate 50 varied announcements
    const announcements = [
      // JOB OPENINGS (20 announcements - 40%)
      {
        title: 'Summer Internship Program 2024',
        description: 'We are excited to announce our Summer Internship Program! This is a great opportunity for students to gain hands-on experience in local government operations. Interns will work alongside experienced professionals in various departments including IT, Finance, and Public Works.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-07-15T08:00:00Z',
      },
      {
        title: 'Municipal Engineer Position - Now Hiring',
        description: 'The Municipal Engineering Office is seeking a qualified Municipal Engineer. Requirements: Licensed Civil Engineer, minimum 3 years experience in public infrastructure projects. Salary Grade 24.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-08-01T09:00:00Z',
      },
      {
        title: 'IT Support Specialist Needed',
        description: 'Looking for an IT Support Specialist to join our Municipal IT Department. Must be proficient in network administration, hardware troubleshooting, and user support. Fresh graduates are welcome to apply.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-08-15T10:00:00Z',
      },
      {
        title: 'Administrative Assistant - Urgent Hiring',
        description: 'The Office of the Mayor is looking for an Administrative Assistant. Requirements: Bachelor\'s degree, excellent communication skills, proficient in MS Office. Experience in government service is an advantage.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-09-01T08:30:00Z',
      },
      {
        title: 'Sanitary Inspector Vacancy',
        description: 'The Municipal Health Office has an opening for a Sanitary Inspector. Licensed Sanitary Inspector required. Will be responsible for conducting health and sanitation inspections of establishments.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-09-10T11:00:00Z',
      },
      {
        title: 'Budget Officer II - Finance Department',
        description: 'We are hiring a Budget Officer II for the Municipal Budget Office. CPA or relevant degree required, minimum 2 years experience in budget preparation and financial analysis.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-09-20T09:00:00Z',
      },
      {
        title: 'Social Welfare Officer Position Open',
        description: 'Join our Municipal Social Welfare and Development Office! We need a licensed Social Worker with a passion for community service. Will handle various social welfare programs and services.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-10-01T08:00:00Z',
      },
      {
        title: 'Treasury Cashier - Now Accepting Applications',
        description: 'The Municipal Treasurer\'s Office is hiring a Cashier. Requirements: Bachelor\'s degree in Accounting or Finance, bonding company clearance, experience in cash handling preferred.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-10-05T10:00:00Z',
      },
      {
        title: 'Agricultural Technologist Needed',
        description: 'The Municipal Agriculture Office is looking for an Agricultural Technologist. BS Agriculture graduate, knowledgeable in farming techniques and agricultural extension programs.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-10-15T09:30:00Z',
      },
      {
        title: 'Librarian II - Municipal Library',
        description: 'We are hiring a Librarian II for our Municipal Library. Must be a licensed Librarian with experience in library management and cataloging systems.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-10-25T08:00:00Z',
      },
      {
        title: 'Planning Officer - MPDO',
        description: 'The Municipal Planning and Development Office needs a Planning Officer. Urban/Regional Planning degree required, experience in local development planning is a plus.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-11-01T09:00:00Z',
      },
      {
        title: 'Disaster Risk Reduction Officer',
        description: 'Join our MDRRM Office as a Disaster Risk Reduction Officer. Will coordinate disaster preparedness programs and emergency response operations. Training in DRRM required.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-11-10T10:00:00Z',
      },
      {
        title: 'Legal Officer - Legal Department',
        description: 'We are hiring a Legal Officer to provide legal services to the municipality. Must be a lawyer in good standing with the Integrated Bar of the Philippines.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-11-15T08:30:00Z',
      },
      {
        title: 'Utility Worker - Multiple Vacancies',
        description: 'The General Services Office is hiring Utility Workers. Elementary graduate, physically fit, willing to work on shifts. Multiple positions available.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-11-20T09:00:00Z',
      },
      {
        title: 'Accountant III - Accounting Office',
        description: 'Looking for an Accountant III to join our Municipal Accounting Office. CPA license required, with experience in government accounting and auditing.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-11-25T10:00:00Z',
      },
      {
        title: 'Environmental Management Specialist',
        description: 'The Municipal Environment and Natural Resources Office is hiring an Environmental Management Specialist. Degree in Environmental Science or related field required.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-12-01T08:00:00Z',
      },
      {
        title: 'Tourism Officer - Municipal Tourism Office',
        description: 'We need a Tourism Officer to promote our municipality\'s tourist destinations. Background in Tourism or Hospitality Management required.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-12-05T09:30:00Z',
      },
      {
        title: 'Database Administrator - IT Department',
        description: 'The IT Department is looking for a Database Administrator. Must have experience with SQL, database design, and data security. Competitive salary package.',
        category: 'job_opening',
        status: 'active',
        published_at: '2024-12-10T10:00:00Z',
      },
      {
        title: 'Human Resource Management Officer',
        description: 'Join our HRMO as a Human Resource Management Officer. Psychology or HR Management degree required. Will handle recruitment, employee relations, and training programs.',
        category: 'job_opening',
        status: 'archived',
        published_at: '2024-12-15T08:00:00Z',
      },
      {
        title: 'Civil Registrar Assistant',
        description: 'The Office of the Civil Registrar is hiring an Assistant. Will assist in processing birth, marriage, and death certificates. Accuracy and attention to detail are essential.',
        category: 'job_opening',
        status: 'active',
        published_at: '2025-01-02T09:00:00Z',
      },

      // TRAINING PROGRAMS (10 announcements - 20%)
      {
        title: 'Fire Safety and Emergency Response Training',
        description: 'Mandatory fire safety training for all municipal employees. Topics include fire prevention, use of fire extinguishers, and emergency evacuation procedures. Schedule: January 20-21, 2024.',
        category: 'training',
        status: 'archived',
        published_at: '2024-07-20T08:00:00Z',
      },
      {
        title: 'Microsoft Excel Advanced Training Workshop',
        description: 'Enhance your productivity with our Advanced Excel Training! Learn pivot tables, macros, data analysis, and reporting. Open to all municipal employees. Limited slots available.',
        category: 'training',
        status: 'active',
        published_at: '2024-08-25T09:00:00Z',
      },
      {
        title: 'Leadership and Management Development Program',
        description: 'A comprehensive leadership training for supervisors and department heads. Topics include strategic planning, team building, and effective communication. 3-day intensive workshop.',
        category: 'training',
        status: 'archived',
        published_at: '2024-09-05T10:00:00Z',
      },
      {
        title: 'Customer Service Excellence Seminar',
        description: 'Improve your customer service skills! This seminar will cover communication techniques, handling difficult clients, and providing excellent public service. All frontline staff are encouraged to attend.',
        category: 'training',
        status: 'active',
        published_at: '2024-10-10T08:30:00Z',
      },
      {
        title: 'Basic First Aid and CPR Training',
        description: 'Learn life-saving skills with our First Aid and CPR training conducted by certified Red Cross instructors. All employees are encouraged to participate. Certificates will be awarded.',
        category: 'training',
        status: 'active',
        published_at: '2024-11-05T09:00:00Z',
      },
      {
        title: 'Cybersecurity Awareness Workshop',
        description: 'Protect yourself and our systems from cyber threats! This workshop covers password security, phishing prevention, and data protection. Mandatory for all IT and finance personnel.',
        category: 'training',
        status: 'archived',
        published_at: '2024-11-12T10:00:00Z',
      },
      {
        title: 'Project Management Fundamentals Course',
        description: 'Learn project management best practices including planning, execution, monitoring, and closing. Ideal for project coordinators and team leaders. Certificate of completion provided.',
        category: 'training',
        status: 'active',
        published_at: '2024-11-28T08:00:00Z',
      },
      {
        title: 'Records Management and Filing Systems',
        description: 'Improve your office organization with proper records management! Learn classification, filing, retrieval, and disposition of documents. Open to all administrative staff.',
        category: 'training',
        status: 'active',
        published_at: '2024-12-08T09:30:00Z',
      },
      {
        title: 'Anti-Corruption and Ethics in Public Service',
        description: 'A mandatory seminar on ethical conduct, transparency, and accountability in government service. All employees must attend this annual refresher course.',
        category: 'training',
        status: 'active',
        published_at: '2024-12-18T10:00:00Z',
      },
      {
        title: 'Digital Transformation in Local Governance',
        description: 'Explore how technology can improve public service delivery. Topics include e-governance, online services, and data-driven decision making. Interactive workshop format.',
        category: 'training',
        status: 'active',
        published_at: '2025-01-05T08:00:00Z',
      },

      // NOTICES (10 announcements - 20%)
      {
        title: 'Municipal Hall Operating Hours During Summer',
        description: 'Please be advised that during the summer months (April-May), the Municipal Hall will operate from 7:00 AM to 4:00 PM. Regular hours will resume in June.',
        category: 'notice',
        status: 'archived',
        published_at: '2024-07-25T08:00:00Z',
      },
      {
        title: 'Independence Day Holiday Notice',
        description: 'In observance of Independence Day, the Municipal Hall will be closed on June 12, 2024. Regular operations will resume on June 13. Happy Independence Day, Philippines!',
        category: 'notice',
        status: 'archived',
        published_at: '2024-08-05T09:00:00Z',
      },
      {
        title: 'Scheduled System Maintenance - August 15',
        description: 'Please be informed that our online services will be temporarily unavailable on August 15, 2024, from 2:00 AM to 6:00 AM due to scheduled system maintenance and upgrades.',
        category: 'notice',
        status: 'archived',
        published_at: '2024-09-12T10:00:00Z',
      },
      {
        title: 'New Parking Policy for Municipal Employees',
        description: 'Effective October 1, 2024, all employees must register their vehicles with the General Services Office and display parking stickers. Visitor parking is designated at Lot C.',
        category: 'notice',
        status: 'active',
        published_at: '2024-10-20T08:30:00Z',
      },
      {
        title: 'All Saints\' Day and All Souls\' Day Schedule',
        description: 'The Municipal Hall will be closed on November 1-2, 2024, in observance of All Saints\' Day and All Souls\' Day. We will reopen on November 4, 2024.',
        category: 'notice',
        status: 'archived',
        published_at: '2024-11-08T09:00:00Z',
      },
      {
        title: 'Updated COVID-19 Health Protocols',
        description: 'Please observe the following health protocols: Temperature checks at entrances, hand sanitizing, and social distancing in queuing areas. Face masks are optional but recommended.',
        category: 'notice',
        status: 'active',
        published_at: '2024-11-18T10:00:00Z',
      },
      {
        title: 'Water Interruption Advisory - December 2',
        description: 'Due to water line repair works, water supply will be temporarily interrupted on December 2, 2024, from 9:00 AM to 3:00 PM. We apologize for the inconvenience.',
        category: 'notice',
        status: 'archived',
        published_at: '2024-12-12T08:00:00Z',
      },
      {
        title: 'Bonifacio Day Holiday Reminder',
        description: 'The Municipal Hall will be closed on November 30, 2024 (Friday), in observance of Bonifacio Day. Regular office hours resume on Monday, December 2, 2024.',
        category: 'notice',
        status: 'archived',
        published_at: '2024-12-20T09:30:00Z',
      },
      {
        title: 'Year-End Inventory and Property Audit',
        description: 'All departments are required to conduct year-end inventory of supplies, equipment, and properties. Submit inventory reports to the General Services Office by January 10, 2025.',
        category: 'notice',
        status: 'active',
        published_at: '2024-12-28T10:00:00Z',
      },
      {
        title: 'New Year\'s Day Holiday Notice',
        description: 'The Municipal Hall will be closed on January 1, 2025, in observance of New Year\'s Day. We wish everyone a prosperous New Year! Regular operations resume on January 2, 2025.',
        category: 'notice',
        status: 'archived',
        published_at: '2025-01-08T08:00:00Z',
      },

      // GENERAL (10 announcements - 20%)
      {
        title: 'Asuncion Municipal Fiesta Celebration 2024',
        description: 'Join us in celebrating our town fiesta! Activities include parades, street dancing, cultural shows, and food festivals. Save the date: September 15-17, 2024. Everyone is invited!',
        category: 'general',
        status: 'archived',
        published_at: '2024-07-30T08:00:00Z',
      },
      {
        title: 'Employee of the Month - August 2024',
        description: 'Congratulations to Juan dela Cruz from the Treasurer\'s Office for being named Employee of the Month! His dedication to excellent public service is truly commendable. Well done!',
        category: 'general',
        status: 'archived',
        published_at: '2024-08-10T09:00:00Z',
      },
      {
        title: 'Blood Donation Drive - September 25',
        description: 'The Municipal Health Office in partnership with the Philippine Red Cross will conduct a blood donation drive on September 25, 2024. Help save lives - donate blood today!',
        category: 'general',
        status: 'archived',
        published_at: '2024-09-15T10:00:00Z',
      },
      {
        title: 'Municipal Sports Fest 2024',
        description: 'Calling all athletic municipal employees! The annual Sports Fest will be held on October 5-7, 2024. Sports include basketball, volleyball, badminton, and chess. Register now at the HRMO!',
        category: 'general',
        status: 'active',
        published_at: '2024-10-28T08:30:00Z',
      },
      {
        title: 'Tree Planting Activity - Environment Month',
        description: 'In celebration of Environment Month, we will conduct a tree planting activity on November 15, 2024, at the Municipal Eco-Park. Let\'s plant trees for a greener Asuncion!',
        category: 'general',
        status: 'active',
        published_at: '2024-11-22T09:00:00Z',
      },
      {
        title: 'Community Outreach Program - Barangay Visits',
        description: 'The Municipal Social Welfare Office will conduct community outreach programs in various barangays. Distribution of relief goods and medical missions will be provided. Schedule to be announced.',
        category: 'general',
        status: 'active',
        published_at: '2024-12-01T10:00:00Z',
      },
      {
        title: 'Year-End Recognition Awards Ceremony',
        description: 'Join us in recognizing outstanding employees at our Year-End Recognition Awards on December 20, 2024, at the Municipal Convention Center. Congratulations to all awardees!',
        category: 'general',
        status: 'active',
        published_at: '2024-12-14T08:00:00Z',
      },
      {
        title: 'Municipal Christmas Party 2024',
        description: 'Get ready for the most wonderful time of the year! Our annual Christmas Party will be held on December 22, 2024. Expect games, prizes, raffles, and a bountiful feast. See you there!',
        category: 'general',
        status: 'active',
        published_at: '2024-12-22T09:30:00Z',
      },
      {
        title: 'Wellness and Fitness Program Launch',
        description: 'We are launching a Wellness and Fitness Program for all municipal employees! Activities include Zumba sessions, yoga classes, and health screening. Stay healthy, stay fit!',
        category: 'general',
        status: 'active',
        published_at: '2025-01-10T10:00:00Z',
      },
      {
        title: 'Municipal Anniversary Celebration - Save the Date',
        description: 'Mark your calendars! Asuncion\'s Municipal Anniversary is coming up on February 1, 2025. We have exciting events planned including exhibits, competitions, and entertainment programs.',
        category: 'general',
        status: 'active',
        published_at: '2025-01-12T08:00:00Z',
      },
    ];

    // Step 3: Prepare data for insertion
    const announcementsToInsert = announcements.map((ann) => ({
      title: ann.title,
      description: ann.description,
      category: ann.category,
      status: ann.status,
      image_url: imageUrl,
      created_by: hrUserId,
      published_at: ann.published_at,
      created_at: ann.published_at,
    }));

    // Step 4: Insert in batches of 10 to avoid timeout
    console.log('📝 Inserting announcements in batches...\n');

    for (let i = 0; i < announcementsToInsert.length; i += 10) {
      const batch = announcementsToInsert.slice(i, i + 10);
      const { data, error } = await supabase.from('announcements').insert(batch).select();

      if (error) {
        console.error(`❌ Error inserting batch ${i / 10 + 1}:`, error);
      } else {
        console.log(`✅ Inserted batch ${i / 10 + 1} (${batch.length} announcements)`);
      }
    }

    // Step 5: Verify insertion
    const { count, error: countError } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting announcements:', countError);
    } else {
      console.log(`\n✅ Total announcements in database: ${count}`);
      console.log('🎉 Seeding completed successfully!');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seeding function
seedAnnouncements();
