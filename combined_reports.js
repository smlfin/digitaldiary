document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const conversionReportContainer = document.getElementById('conversion-report-container');
    const amountReportContainer = document.getElementById('amount-report-container');
    const productReportContainer = document.getElementById('product-report-container');
    const visitReportContainer = document.getElementById('visit-report-container');
    const noDataMessage = document.getElementById('no-data-message');
    const messageText = document.getElementById('message-text');

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
                    obj[header] = values[i] || '';
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

    const generateConversionReport = (data) => {
        const branchData = {};

        data.forEach(lead => {
            const branchName = lead.BRANCHNAME;
            if (!branchData[branchName]) {
                branchData[branchName] = { total: 0, closed: 0 };
            }
            branchData[branchName].total++;
            if (lead.LeadStatus === 'Closed') {
                branchData[branchName].closed++;
            }
        });

        const sortedBranches = Object.keys(branchData).sort();

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Lead Conversion by Branch</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-blue-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Branch Name</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Leads</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-blue-800 uppercase tracking-wider">Closed Leads</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-blue-800 uppercase tracking-wider">Conversion Rate</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        sortedBranches.forEach(branch => {
            const totalLeads = branchData[branch].total;
            const closedLeads = branchData[branch].closed;
            const conversionRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(2) : 0;
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${branch}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm text-gray-500">${totalLeads}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-green-600">${closedLeads}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-blue-600">${conversionRate}%</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        conversionReportContainer.innerHTML = htmlContent;
    };

    const generateClosedAmountReport = (data) => {
        const employeeData = {};
        data.forEach(lead => {
            if (lead.LeadStatus === 'Closed') {
                const employeeName = lead.EMPLOYEENAME;
                const closedAmount = parseFloat(lead.ClosedAmount) || 0;
                if (!employeeData[employeeName]) {
                    employeeData[employeeName] = { totalAmount: 0, count: 0 };
                }
                employeeData[employeeName].totalAmount += closedAmount;
                employeeData[employeeName].count++;
            }
        });

        const sortedEmployees = Object.keys(employeeData).sort((a, b) => employeeData[b].totalAmount - employeeData[a].totalAmount);

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Total Closed Amount by Employee</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-green-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-green-800 uppercase tracking-wider">Employee Name</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-green-800 uppercase tracking-wider">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;
        
        sortedEmployees.forEach(employee => {
            const totalAmount = employeeData[employee].totalAmount.toFixed(2);
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${employee}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-green-600">${totalAmount}</td>
                </tr>`;
        });

        htmlContent += `</tbody></table></div>`;
        amountReportContainer.innerHTML = htmlContent;
    };

    const generateClosedLeadsByProductReport = (data) => {
        const productData = {};
        data.forEach(lead => {
            if (lead.LeadStatus === 'Closed') {
                const product = lead.ProductOffered;
                if (!productData[product]) {
                    productData[product] = 0;
                }
                productData[product]++;
            }
        });

        const sortedProducts = Object.keys(productData).sort((a, b) => productData[b] - productData[a]);
        
        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Closed Leads by Product Offered</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-yellow-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-yellow-800 uppercase tracking-wider">Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-yellow-800 uppercase tracking-wider">Closed Leads</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        sortedProducts.forEach(product => {
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${product}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-yellow-600">${productData[product]}</td>
                </tr>`;
        });

        htmlContent += `</tbody></table></div>`;
        productReportContainer.innerHTML = htmlContent;
    };
    
    const generateVisitConversionReport = (data) => {
        const visitData = {};
        data.forEach(lead => {
            const visits = parseInt(lead.TotalVisits) || 0;
            if (!visitData[visits]) {
                visitData[visits] = { total: 0, closed: 0 };
            }
            visitData[visits].total++;
            if (lead.LeadStatus === 'Closed') {
                visitData[visits].closed++;
            }
        });

        Object.keys(visitData).forEach(visits => {
            const total = visitData[visits].total;
            const closed = visitData[visits].closed;
            visitData[visits].conversionRate = total > 0 ? ((closed / total) * 100).toFixed(2) : 0;
        });

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Conversion Rate by Total Visits</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-purple-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider border-b border-gray-300">Total Visits</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-purple-800 uppercase tracking-wider border-b border-gray-300">Total Leads</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-purple-800 uppercase tracking-wider border-b border-gray-300">Closed Leads</th>
                            <th class="py-3 px-6 bg-purple-200 text-purple-700 font-bold border-b border-gray-300">Conversion Rate</th>
                        </tr>
                    </thead>
                    <tbody class="text-gray-800 text-base font-light">`;
        const sortedVisits = Object.keys(visitData).sort((a, b) => a - b);
        sortedVisits.forEach(visits => {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${visits}</td>
                    <td class="py-3 px-6">${visitData[visits].total}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${visitData[visits].closed}</td>
                    <td class="py-3 px-6 font-semibold text-purple-600">${visitData[visits].conversionRate}%</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        visitReportContainer.innerHTML = htmlContent;
    };

    const initCombinedReports = async () => {
        const allData = await fetchAndParseData();
        if (allData.length > 0) {
            generateConversionReport(allData);
            generateClosedAmountReport(allData);
            generateClosedLeadsByProductReport(allData);
            generateVisitConversionReport(allData);
            noDataMessage.classList.add('hidden');
        } else {
            noDataMessage.classList.remove('hidden');
            messageText.textContent = 'No data available to generate reports.';
        }
    };

    initCombinedReports();
});