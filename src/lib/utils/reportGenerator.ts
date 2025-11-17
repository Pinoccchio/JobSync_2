import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/auth';

interface DashboardStats {
  totalScanned: number;
  pendingReview: number;
  inProgress: number;
  approvedHired: number;
  deniedWithdrawn: number;
  archived: number;
  activeJobs: number;
}

export async function generateDashboardReport(stats: DashboardStats): Promise<void> {
  try {
    console.log('📊 Generating dashboard report...');

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // 1. Summary Statistics Sheet
    const summaryData = [
      ['JobSync HR Dashboard Report'],
      ['Generated on:', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Applications', stats.totalScanned],
      ['Pending Review', stats.pendingReview],
      ['In Progress (Under Review, Shortlisted, Interviewed)', stats.inProgress],
      ['Approved / Hired', stats.approvedHired],
      ['Denied / Withdrawn', stats.deniedWithdrawn],
      ['Archived', stats.archived],
      ['Active Job Postings', stats.activeJobs],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // 2. Applications List Sheet
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        match_score,
        applicant_profiles (
          full_name,
          email,
          phone
        ),
        jobs (
          title,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    const applicationsData = [
      ['Application ID', 'Applicant Name', 'Email', 'Phone', 'Job Title', 'Department', 'Status', 'Match Score', 'Applied Date'],
      ...(applications || []).map((app: any) => [
        app.id,
        app.applicant_profiles?.full_name || 'N/A',
        app.applicant_profiles?.email || 'N/A',
        app.applicant_profiles?.phone || 'N/A',
        app.jobs?.title || 'N/A',
        app.jobs?.department || 'N/A',
        app.status,
        app.match_score || 'N/A',
        new Date(app.created_at).toLocaleDateString(),
      ]),
    ];
    const applicationsSheet = XLSX.utils.aoa_to_sheet(applicationsData);
    XLSX.utils.book_append_sheet(workbook, applicationsSheet, 'Applications');

    // 3. Job Distribution Sheet
    const { data: jobStats, error: jobError } = await supabase
      .from('applications')
      .select(`
        job_id,
        jobs (
          title,
          department
        )
      `);

    if (jobError) throw jobError;

    // Count applications per job
    const jobCounts: Record<string, { title: string; department: string; count: number }> = {};
    (jobStats || []).forEach((app: any) => {
      const jobId = app.job_id;
      if (!jobCounts[jobId]) {
        jobCounts[jobId] = {
          title: app.jobs?.title || 'Unknown',
          department: app.jobs?.department || 'Unknown',
          count: 0,
        };
      }
      jobCounts[jobId].count++;
    });

    const jobDistributionData = [
      ['Job Title', 'Department', 'Application Count'],
      ...Object.values(jobCounts)
        .sort((a, b) => b.count - a.count)
        .map((job) => [job.title, job.department, job.count]),
    ];
    const jobDistributionSheet = XLSX.utils.aoa_to_sheet(jobDistributionData);
    XLSX.utils.book_append_sheet(workbook, jobDistributionSheet, 'Job Distribution');

    // 4. Monthly Trends Sheet
    const { data: monthlyData, error: monthError } = await supabase
      .from('applications')
      .select('created_at');

    if (monthError) throw monthError;

    // Group by month
    const monthCounts: Record<string, number> = {};
    (monthlyData || []).forEach((app) => {
      const date = new Date(app.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });

    const monthlyTrendsData = [
      ['Month', 'Applications'],
      ...Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => {
          const [year, monthNum] = month.split('-');
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return [`${monthNames[parseInt(monthNum) - 1]} ${year}`, count];
        }),
    ];
    const monthlyTrendsSheet = XLSX.utils.aoa_to_sheet(monthlyTrendsData);
    XLSX.utils.book_append_sheet(workbook, monthlyTrendsSheet, 'Monthly Trends');

    // Generate file and download
    const fileName = `JobSync_Dashboard_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    console.log('✅ Report generated successfully:', fileName);
  } catch (error) {
    console.error('❌ Error generating report:', error);
    throw error;
  }
}
