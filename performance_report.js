document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const branchSelect = document.getElementById('report-branch-select');
    const companySnapshotContainer = document.getElementById('company-snapshot-container');
    const snapshotData = document.getElementById('snapshot-data');
    const reportSummaryContainer = document.getElementById('report-summary-container');
    const reportDetailsContainer = document.getElementById('report-details-container');
    const incompleteLeadsList = document.getElementById('incomplete-leads-list');
    const backToSummaryButton = document.getElementById('back-to-summary');
    const noDataMessage = document.getElementById('report-no-data-message');
    const messageText = document.getElementById('report-message-text');

    let allData = [];
    const sections = {
        "Lead & Employee Info": [
            { key: "BRANCHNAME", label: "Branch Name" },
            { key: "EMPLOYEENAME", label: "Employee Name" },
            { key: "EMPLOYEECODE", label: "Employee Code" },
            { key: "CustomerName", label: "Customer Name" }
        ],
        "Job & Income": [
            { key: "JobCategory", label: "Job Category" },
            { key: "JobDetails", label: "Job Details" },
            { key: "Averagemonthlycome", label: "Average Monthly Income" }
        ],
        "Customer Contact Details": [
            { key: 'CustomerName', label: 'Customer Name' },
            { key: 'CustomerAddress', label: 'Customer Address' },
            { key: 'StreetPlace', label: 'Street / Place' },
            { key: 'District', label: 'District' },
            { key: 'Pincode', label: 'Pincode' },
            { key: 'Customerphonenumber', label: 'Customer Phone Number' }
        ],
        "Personal & Family Details": [
            { key: 'Birthday', label: 'Birthday' },
            { key: 'WeddingDay', label: 'Wedding Day' },
            { key: 'ApproximateAge', label: 'Approximate Age' },
            { key: 'HusbandWifeName', label: 'Husband / Wife Name' },
            { key: 'HusbandWifeJob', label: 'Husband / Wife Job' },
            { key: 'ChildrenNames', label: 'Children Name(s)' },
            { key: 'ChildrenDetails', label: 'Children Details' },
            { key: 'CustomerProfile', label: 'Customer Profile' },
            { key: 'WhethercloseCircleContact', label: 'Close Circle Contact?' },
            { key: 'Detaileddescriptionrelation', label: 'Detailed Description & Relation' }
        ]
    };
    const fieldsToCheck = Object.values(sections).flat().map(field => field.key);
    const incompleteValues = ['na', 'n/a', '.', '-', '*'];

    const getIncompleteFields = (lead) => {
        return fieldsToCheck.filter(field => {
            const value = String(lead[field]).trim().toLowerCase();
            return !lead[field] || value === '' || incompleteValues.includes(value);
        });
    };

    const fetchAndParseData = async () => {
        try {
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            const headers = rows[0].split(',').map(header => header.trim().replace(/[^a-zA-Z0-9]/g, ''));

            const parsedData = rows.slice(1).map(row => {
                const values = row.split(',');
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] ? values[i].trim() : '';
                });
                return obj;
            });

            return parsedData;

        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            noDataMessage.classList.remove('hidden');
            messageText.textContent = 'Failed to load data. Please check the source URL.';
            return [];
        }
    };
    
    const renderCompanySnapshot = (data) => {
        const totalLeads = data.length;
        const totalIncomplete = data.filter(lead => getIncompleteFields(lead).length > 0).length;
        const totalComplete = totalLeads - totalIncomplete;
        const uniqueBranches = [...new Set(data.map(lead => lead.BRANCHNAME))].length;
        const uniqueEmployees = [...new Set(data.map(lead => lead.EMPLOYEENAME))].length;

        const incompletePercent = totalLeads > 0 ? ((totalIncomplete / totalLeads) * 100).toFixed(2) : 0;
        const completePercent = totalLeads > 0 ? ((totalComplete / totalLeads) * 100).toFixed(2) : 0;

        const htmlContent = `
            <div class="bg-blue-100 p-4 rounded-lg shadow-md text-center">
                <p class="text-4xl font-extrabold text-blue-600">${totalLeads}</p>
                <p class="text-sm font-semibold text-blue-800 uppercase tracking-wide mt-1">Total Leads</p>
            </div>
            <div class="bg-red-100 p-4 rounded-lg shadow-md text-center">
                <p class="text-4xl font-extrabold text-red-600">${totalIncomplete} <span class="text-2xl font-normal">(${incompletePercent}%)</span></p>
                <p class="text-sm font-semibold text-red-800 uppercase tracking-wide mt-1">Incomplete Leads</p>
            </div>
            <div class="bg-green-100 p-4 rounded-lg shadow-md text-center">
                <p class="text-4xl font-extrabold text-green-600">${totalComplete} <span class="text-2xl font-normal">(${completePercent}%)</span></p>
                <p class="text-sm font-semibold text-green-800 uppercase tracking-wide mt-1">Complete Leads</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                <p class="text-4xl font-extrabold text-gray-600">${uniqueBranches}</p>
                <p class="text-sm font-semibold text-gray-800 uppercase tracking-wide mt-1">Number of Branches</p>
            </div>
            <div class="bg-gray-100 p-4 rounded-lg shadow-md text-center">
                <p class="text-4xl font-extrabold text-gray-600">${uniqueEmployees}</p>
                <p class="text-sm font-semibold text-gray-800 uppercase tracking-wide mt-1">Number of Employees</p>
            </div>
        `;
        snapshotData.innerHTML = htmlContent;
        companySnapshotContainer.classList.remove('hidden');
    };
    
    const renderSummaryReport = (branchName) => {
        const branchLeads = allData.filter(lead => lead.BRANCHNAME === branchName);
        const employees = [...new Set(branchLeads.map(d => d.EMPLOYEENAME))].sort();

        let totalLeads = branchLeads.length;
        let totalIncomplete = branchLeads.filter(lead => getIncompleteFields(lead).length > 0).length;
        let totalComplete = totalLeads - totalIncomplete;

        const incompletePercent = totalLeads > 0 ? ((totalIncomplete / totalLeads) * 100).toFixed(2) : 0;
        const completePercent = totalLeads > 0 ? ((totalComplete / totalLeads) * 100).toFixed(2) : 0;

        let htmlContent = `
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Summary for ${branchName}</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-blue-100 p-4 rounded-lg shadow-md text-center">
                    <p class="text-4xl font-extrabold text-blue-600">${totalLeads}</p>
                    <p class="text-sm font-semibold text-blue-800 uppercase tracking-wide mt-1">Total Leads</p>
                </div>
                <div class="bg-red-100 p-4 rounded-lg shadow-md text-center cursor-pointer" data-report-type="incomplete">
                    <p class="text-4xl font-extrabold text-red-600">${totalIncomplete} <span class="text-2xl font-normal">(${incompletePercent}%)</span></p>
                    <p class="text-sm font-semibold text-red-800 uppercase tracking-wide mt-1">Incomplete Leads</p>
                </div>
                <div class="bg-green-100 p-4 rounded-lg shadow-md text-center">
                    <p class="text-4xl font-extrabold text-green-600">${totalComplete} <span class="text-2xl font-normal">(${completePercent}%)</span></p>
                    <p class="text-sm font-semibold text-green-800 uppercase tracking-wide mt-1">Complete Leads</p>
                </div>
            </div>
            
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Employee Breakdown</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-gray-200">
                        <tr>
                            <th class="py-3 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee Name</th>
                            <th class="py-3 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Leads</th>
                            <th class="py-3 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Incomplete Leads</th>
                            <th class="py-3 px-6 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">% Incomplete</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;
        
        employees.forEach(employee => {
            const employeeLeads = allData.filter(lead => lead.BRANCHNAME === branchName && lead.EMPLOYEENAME === employee);
            const employeeIncompleteLeads = employeeLeads.filter(lead => getIncompleteFields(lead).length > 0);
            const employeeIncompletePercent = employeeLeads.length > 0 ? ((employeeIncompleteLeads.length / employeeLeads.length) * 100).toFixed(2) : 0;
            
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${employee}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-sm text-center text-gray-500">${employeeLeads.length}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-sm text-center text-red-500">
                        <a href="#" class="incomplete-leads-link font-semibold hover:underline" data-employee-name="${employee}" data-branch-name="${branchName}">${employeeIncompleteLeads.length}</a>
                    </td>
                    <td class="py-4 px-6 whitespace-nowrap text-sm text-center text-red-500">${employeeIncompletePercent}%</td>
                </tr>`;
        });

        htmlContent += `
                    </tbody>
                </table>
            </div>`;
        
        reportSummaryContainer.innerHTML = htmlContent;
        reportSummaryContainer.classList.remove('hidden');
        noDataMessage.classList.add('hidden');
    };
    
    const renderDetailedReport = (employeeName, branchName) => {
        const employeeIncompleteLeads = allData.filter(lead => lead.BRANCHNAME === branchName && lead.EMPLOYEENAME === employeeName && getIncompleteFields(lead).length > 0);
        
        let htmlContent = `<h3 class="text-2xl font-bold mb-4">Incomplete Leads for ${employeeName}</h3>`;

        if (employeeIncompleteLeads.length > 0) {
            employeeIncompleteLeads.forEach(lead => {
                const missingFields = getIncompleteFields(lead);
                htmlContent += `
                    <div class="mb-6 p-4 border rounded-lg bg-white shadow-sm">
                        <h4 class="text-lg font-semibold text-gray-900">${lead.CustomerName || 'Unnamed Customer'}</h4>
                        <ul class="list-disc list-inside mt-2 text-gray-700">`;
                missingFields.forEach(field => {
                    const sectionName = Object.keys(sections).find(section => sections[section].some(f => f.key === field));
                    const fieldLabel = sections[sectionName].find(f => f.key === field).label;
                    htmlContent += `<li>Missing: <span class="font-medium">${fieldLabel}</span></li>`;
                });
                htmlContent += `
                        </ul>
                    </div>`;
            });
        } else {
            htmlContent += `<p class="text-gray-500 font-medium">No incomplete leads found for this employee.</p>`;
        }

        incompleteLeadsList.innerHTML = htmlContent;
        reportSummaryContainer.classList.add('hidden');
        reportDetailsContainer.classList.remove('hidden');
    };
    
    backToSummaryButton.addEventListener('click', () => {
        reportSummaryContainer.classList.remove('hidden');
        reportDetailsContainer.classList.add('hidden');
    });

    branchSelect.addEventListener('change', (event) => {
        const selectedBranch = event.target.value;
        renderSummaryReport(selectedBranch);
    });

    document.addEventListener('click', (event) => {
        const link = event.target.closest('.incomplete-leads-link');
        if (link) {
            event.preventDefault();
            const employeeName = link.dataset.employeeName;
            const branchName = link.dataset.branchName;
            renderDetailedReport(employeeName, branchName);
        }
    });

    const initDashboard = async () => {
        allData = await fetchAndParseData();
        if (allData.length > 0) {
            renderCompanySnapshot(allData);
            const branches = [...new Set(allData.map(d => d.BRANCHNAME))].sort();
            branches.forEach(branch => {
                const option = document.createElement('option');
                option.value = branch;
                option.textContent = branch;
                branchSelect.appendChild(option);
            });
            noDataMessage.classList.remove('hidden');
            messageText.textContent = 'Please select a branch to view the report.';
        }
    };

    initDashboard();
});