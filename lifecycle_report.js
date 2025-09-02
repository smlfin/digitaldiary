document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const timeToCloseContainer = document.getElementById('time-to-close-container');
    const followUpFrequencyContainer = document.getElementById('follow-up-frequency-container');
    const pipelineHealthContainer = document.getElementById('pipeline-health-container');
    const noDataMessage = document.getElementById('lifecycle-no-data-message');
    const messageText = document.getElementById('lifecycle-message-text');

    const fetchAndParseData = async () => {
        try {
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            const headers = rows[0].split(',').map(header => header.trim().replace(/[^a-zA-Z0-9]/g, ''));

            const parsedData = rows.slice(1).map(row => {
                const values = [];
                let inQuote = false;
                let currentItem = '';

                for (let i = 0; i < row.length; i++) {
                    const char = row[i];
                    if (char === '"') inQuote = !inQuote;
                    else if (char === ',' && !inQuote) {
                        values.push(currentItem.trim());
                        currentItem = '';
                    } else currentItem += char;
                }
                values.push(currentItem.trim());
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || 'N/A';
                });
                return obj;
            });
            return parsedData;
        } catch (error) {
            console.error("Error fetching or parsing CSV:", error);
            messageText.textContent = "Failed to load data. Please check the CSV link and your network connection.";
            return [];
        }
    };

    const generateTimeToCloseReport = (data) => {
        const closedLeads = data.filter(lead => lead.LeadStatus && lead.LeadStatus.trim().toLowerCase() === 'closed');
        let totalDaysToClose = 0;
        let closedLeadsCount = 0;

        closedLeads.forEach(lead => {
            if (lead.Timestamp && lead.DateClosed) {
                const startDate = new Date(lead.Timestamp);
                const endDate = new Date(lead.DateClosed);
                if (!isNaN(startDate) && !isNaN(endDate)) {
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                    if (dayDiff > 0) {
                        totalDaysToClose += dayDiff;
                        closedLeadsCount++;
                    }
                }
            }
        });

        const averageDays = closedLeadsCount > 0 ? (totalDaysToClose / closedLeadsCount).toFixed(2) : 'N/A';

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Time-to-Close Analysis</h3>
            <p class="text-lg text-gray-700">The average time it takes for a lead to close is:</p>
            <div class="mt-4 text-center">
                <span class="text-6xl font-extrabold text-purple-600">${averageDays}</span>
                <span class="text-xl font-bold text-gray-500"> days</span>
            </div>
            <p class="text-sm text-gray-500 mt-2 text-center">Based on ${closedLeadsCount} closed leads.</p>
        </div>`;
        timeToCloseContainer.innerHTML = htmlContent;
    };

    const generateFollowUpFrequencyReport = (data) => {
        const followUpCounts = {};
        const followUpFields = ['VisitDays', 'Mention'];
        
        data.forEach(lead => {
            const employeeName = lead.EMPLOYEENAME || 'N/A';
            if (!followUpCounts[employeeName]) {
                followUpCounts[employeeName] = 0;
            }
            followUpFields.forEach(field => {
                if (lead[field] && lead[field].trim() !== '' && lead[field].trim() !== 'N/A' && lead[field].trim() !== '.') {
                    followUpCounts[employeeName]++;
                }
            });
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Follow-up Frequency by Employee</h3>
            <p class="text-sm text-gray-500 mb-4">This report counts how many times follow-up-related fields (VisitDays and Mention) were filled out for each employee's leads.</p>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Employee Name</th>
                        <th class="py-3 px-6 bg-purple-200 text-purple-700 font-bold border-b border-gray-300">Total Follow-ups</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        
        for (const employee in followUpCounts) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${employee}</td>
                    <td class="py-3 px-6 font-semibold text-purple-600">${followUpCounts[employee]}</td>
                </tr>`;
        }
        
        htmlContent += `
                </tbody>
            </table>
        </div>`;
        followUpFrequencyContainer.innerHTML = htmlContent;
    };

    const generatePipelineHealthReport = (data) => {
        const statusCounts = {};
        data.forEach(lead => {
            const status = lead.LeadStatus || 'N/A';
            if (!statusCounts[status]) {
                statusCounts[status] = 0;
            }
            statusCounts[status]++;
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Pipeline Health Dashboard</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Lead Status</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Number of Leads</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        
        for (const status in statusCounts) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${status}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${statusCounts[status]}</td>
                </tr>`;
        }
        
        htmlContent += `
                </tbody>
            </table>
        </div>`;
        pipelineHealthContainer.innerHTML = htmlContent;
    };

    const initLifecycleReports = async () => {
        const allData = await fetchAndParseData();
        if (allData.length > 0) {
            generateTimeToCloseReport(allData);
            generateFollowUpFrequencyReport(allData);
            generatePipelineHealthReport(allData);
            noDataMessage.classList.add('hidden');
        } else {
            messageText.textContent = "No data found in the Google Sheet.";
            noDataMessage.classList.remove('hidden');
        }
    };
    
    initLifecycleReports();
});