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

    const generateConversionReport = (data) => {
        const employeeData = {};
        data.forEach(lead => {
            const employeeName = lead.EMPLOYEENAME;
            if (!employeeData[employeeName]) {
                employeeData[employeeName] = { totalLeads: 0, closedLeads: 0 };
            }
            employeeData[employeeName].totalLeads++;
            if (lead.LeadStatus && lead.LeadStatus.trim().toLowerCase() === 'closed') {
                employeeData[employeeName].closedLeads++;
            }
        });
        
        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Lead Conversion Rate by Employee</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Employee Name</th>
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Total Leads</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Closed Leads</th>
                        <th class="py-3 px-6 bg-purple-200 text-purple-700 font-bold border-b border-gray-300">Conversion Rate</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        for (const employee in employeeData) {
            const conversionRate = employeeData[employee].totalLeads > 0 ? ((employeeData[employee].closedLeads / employeeData[employee].totalLeads) * 100).toFixed(2) : 0;
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${employee}</td>
                    <td class="py-3 px-6">${employeeData[employee].totalLeads}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${employeeData[employee].closedLeads}</td>
                    <td class="py-3 px-6 font-semibold text-purple-600">${conversionRate}%</td>
                </tr>`;
        }
        htmlContent += `</tbody></table></div>`;
        conversionReportContainer.innerHTML = htmlContent;
    };

    const generateClosedAmountReport = (data) => {
        const branchData = {};
        data.forEach(lead => {
            const branchName = lead.BRANCHNAME;
            const closedAmount = parseFloat(lead.ClosedAmount) || 0;
            if (lead.LeadStatus && lead.LeadStatus.trim().toLowerCase() === 'closed') {
                if (!branchData[branchName]) {
                    branchData[branchName] = 0;
                }
                branchData[branchName] += closedAmount;
            }
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Closed Amount by Branch</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Branch Name</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Total Closed Amount</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        for (const branch in branchData) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${branch}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">Rs. ${branchData[branch].toFixed(2)}</td>
                </tr>`;
        }
        htmlContent += `</tbody></table></div>`;
        amountReportContainer.innerHTML = htmlContent;
    };

    const generateClosedLeadsByProductReport = (data) => {
        const productData = {};
        data.forEach(lead => {
            if (lead.LeadStatus && lead.LeadStatus.trim().toLowerCase() === 'closed') {
                const product = lead.ProductDiscussed;
                if (product && product.trim() !== 'N/A' && product.trim() !== '' && product.trim() !== ' ' && product.trim() !== '.' && product.trim() !== '-') {
                    if (!productData[product]) {
                        productData[product] = 0;
                    }
                    productData[product]++;
                }
            }
        });

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Closed Leads by Product</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Product</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Closed Leads</th>
                    </tr>
                </thead>
                <tbody class="text-gray-800 text-base font-light">`;
        for (const product in productData) {
            htmlContent += `
                <tr class="hover:bg-gray-100 transition-colors">
                    <td class="py-3 px-6 whitespace-nowrap">${product}</td>
                    <td class="py-3 px-6 font-semibold text-green-600">${productData[product]}</td>
                </tr>`;
        }
        htmlContent += `</tbody></table></div>`;
        productReportContainer.innerHTML = htmlContent;
    };

    const generateVisitConversionReport = (data) => {
        const visitData = {};
        data.forEach(lead => {
            const visits = parseInt(lead.Howmanyvisitcompleted) || 0;
            const status = lead.LeadStatus ? lead.LeadStatus.trim().toLowerCase() : '';

            if (!visitData[visits]) {
                visitData[visits] = { total: 0, closed: 0, conversionRate: 0 };
            }
            visitData[visits].total++;
            if (status === 'closed') {
                visitData[visits].closed++;
            }
        });
        for (const visits in visitData) {
            if (visitData[visits].total > 0) {
                visitData[visits].conversionRate = ((visitData[visits].closed / visitData[visits].total) * 100).toFixed(2);
            }
        }

        let htmlContent = `<div class="bg-gray-50 rounded-lg p-6 shadow-inner">
            <h3 class="text-2xl font-bold mb-4">Visit-to-Conversion Analysis</h3>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="text-gray-600 uppercase text-sm leading-normal">
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Number of Visits</th>
                        <th class="py-3 px-6 bg-gray-200 font-bold border-b border-gray-300">Total Leads</th>
                        <th class="py-3 px-6 bg-green-200 text-green-700 font-bold border-b border-gray-300">Closed Leads</th>
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
        } else {
            noDataMessage.classList.remove('hidden');
        }
    };

    initCombinedReports();
});