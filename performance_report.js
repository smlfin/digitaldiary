document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const branchSelect = document.getElementById('report-branch-select');
    const reportSummaryContainer = document.getElementById('report-summary-container');
    const reportDetailsContainer = document.getElementById('report-details-container');
    const incompleteLeadsList = document.getElementById('incomplete-leads-list');
    const backToSummaryButton = document.getElementById('back-to-summary');
    const noDataMessage = document.getElementById('report-no-data-message');
    const messageText = document.getElementById('report-message-text');

    let allData = [];
    const fieldsToCheck = [
        'Timestamp', 'BRANCHNAME', 'EMPLOYEENAME', 'EMPLOYEECODE',
        'JobCategory', 'JobDetails', 'Averagemonthlycome',
        'CustomerName', 'CustomerAddress', 'StreetPlace', 'District', 'Pincode', 'Customerphonenumber',
        'Birthday', 'WeddingDay', 'ApproximateAge', 'HusbandWifeName', 'HusbandWifeJob', 'ChildrenNames',
        'ChildrenDetails', 'CustomerProfile', 'WhethercloseCircleContact', 'Detaileddescriptionrelation'
    ];
    const incompleteValues = ['N/A', '.', '-', ' '];

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
                    if (char === '"') {
                        inQuote = !inQuote;
                    } else if (char === ',' && !inQuote) {
                        values.push(currentItem.trim());
                        currentItem = '';
                    } else {
                        currentItem += char;
                    }
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

    const getIncompleteFields = (lead) => {
        const missingFields = [];
        fieldsToCheck.forEach(field => {
            const value = lead[field] ? lead[field].trim() : '';
            if (value === '' || incompleteValues.includes(value)) {
                missingFields.push(field);
            }
        });
        return missingFields;
    };

    const initReport = async () => {
        allData = await fetchAndParseData();
        if (allData.length > 0) {
            populateBranches();
            noDataMessage.classList.add('hidden');
        } else {
            messageText.textContent = "No data found in the Google Sheet.";
            noDataMessage.classList.remove('hidden');
        }
    };

    const populateBranches = () => {
        const branches = [...new Set(allData.map(lead => lead.BRANCHNAME))];
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
    };

    branchSelect.addEventListener('change', () => {
        const selectedBranch = branchSelect.value;
        const branchLeads = allData.filter(lead => lead.BRANCHNAME === selectedBranch);
        
        const employeeData = {};
        branchLeads.forEach(lead => {
            const employeeName = lead.EMPLOYEENAME;
            if (!employeeData[employeeName]) {
                employeeData[employeeName] = {
                    total: 0,
                    completed: 0,
                    incomplete: 0,
                };
            }
            employeeData[employeeName].total++;
            if (getIncompleteFields(lead).length === 0) {
                employeeData[employeeName].completed++;
            } else {
                employeeData[employeeName].incomplete++;
            }
        });
        
        renderReportSummary(employeeData);
        reportSummaryContainer.classList.remove('hidden');
        reportDetailsContainer.classList.add('hidden');
    });

    const renderReportSummary = (data) => {
        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Employee Performance Summary</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Employee Name</th>
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Total Leads</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Completed Leads</th>
                        <th class="py-3 px-6 bg-red-200 text-red-700 font-bold border-b border-gray-300 text-center">Incomplete Leads</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        
        for (const employee in data) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${employee}</td>
                    <td class="py-3 px-6">${data[employee].total}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${data[employee].completed}</td>
                    <td class="py-3 px-6 text-center">
                        <button class="incomplete-leads-button text-red-600 font-bold hover:underline" data-employee="${employee}" data-branch="${branchSelect.value}">
                            ${data[employee].incomplete}
                        </button>
                    </td>
                </tr>`;
        }
        
        htmlContent += `
                </tbody>
            </table>
        </div>`;
        reportSummaryContainer.innerHTML = htmlContent;
        
        document.querySelectorAll('.incomplete-leads-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const employee = e.target.dataset.employee;
                const branch = e.target.dataset.branch;
                renderDetailedReport(employee, branch);
            });
        });
    };
    
    const renderDetailedReport = (employeeName, branchName) => {
        const employeeLeads = allData.filter(lead => lead.BRANCHNAME === branchName && lead.EMPLOYEENAME === employeeName);
        
        let htmlContent = `<h3 class="text-2xl font-bold mb-4">Incomplete Leads for ${employeeName}</h3>`;
        
        employeeLeads.forEach(lead => {
            const missingFields = getIncompleteFields(lead);
            if (missingFields.length > 0) {
                htmlContent += `
                    <div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">
                        <h4 class="text-lg font-semibold text-gray-900">${lead.CustomerName || 'Unnamed Customer'}</h4>
                        <ul class="list-disc list-inside mt-2 text-gray-700">`;
                missingFields.forEach(field => {
                    htmlContent += `<li>Missing: <span class="font-medium">${field}</span></li>`;
                });
                htmlContent += `
                        </ul>
                    </div>`;
            }
        });

        incompleteLeadsList.innerHTML = htmlContent;
        reportSummaryContainer.classList.add('hidden');
        reportDetailsContainer.classList.remove('hidden');
    };
    
    backToSummaryButton.addEventListener('click', () => {
        reportSummaryContainer.classList.remove('hidden');
        reportDetailsContainer.classList.add('hidden');
    });

    initReport();
});