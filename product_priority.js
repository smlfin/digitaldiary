document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const mostPitchedContainer = document.getElementById('most-pitched-container');
    const mostClosedContainer = document.getElementById('most-closed-container');
    const preferredByAgeContainer = document.getElementById('preferred-by-age-container');
    const preferredByIncomeContainer = document.getElementById('preferred-by-income-container');
    const mostEasilyClosedContainer = document.getElementById('most-easily-closed-container');
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

    const generateMostPitchedReport = (data) => {
        const productPitchedCount = {};
        data.forEach(lead => {
            const product = lead.ProductOffered;
            if (product) {
                if (!productPitchedCount[product]) {
                    productPitchedCount[product] = 0;
                }
                productPitchedCount[product]++;
            }
        });

        const sortedProducts = Object.keys(productPitchedCount).sort((a, b) => productPitchedCount[b] - productPitchedCount[a]);

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Most Pitched Products</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-indigo-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-indigo-800 uppercase tracking-wider">Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-indigo-800 uppercase tracking-wider">Pitched Count</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        sortedProducts.forEach(product => {
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${product}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-indigo-600">${productPitchedCount[product]}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        mostPitchedContainer.innerHTML = htmlContent;
    };

    const generateMostClosedReport = (data) => {
        const productClosedCount = {};
        data.forEach(lead => {
            if (lead.LeadStatus === 'Closed') {
                const product = lead.ProductOffered;
                if (product) {
                    if (!productClosedCount[product]) {
                        productClosedCount[product] = 0;
                    }
                    productClosedCount[product]++;
                }
            }
        });

        const sortedProducts = Object.keys(productClosedCount).sort((a, b) => productClosedCount[b] - productClosedCount[a]);

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Most Closed Products</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-green-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-green-800 uppercase tracking-wider">Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-green-800 uppercase tracking-wider">Closed Leads</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        sortedProducts.forEach(product => {
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${product}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-green-600">${productClosedCount[product]}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        mostClosedContainer.innerHTML = htmlContent;
    };

    const getAgeGroup = (age) => {
        if (!age || isNaN(age)) return 'N/A';
        if (age < 20) return 'Under 20';
        if (age <= 30) return '20-30';
        if (age <= 40) return '31-40';
        if (age <= 50) return '41-50';
        if (age <= 60) return '51-60';
        return 'Over 60';
    };

    const generatePreferredByAgeReport = (data) => {
        const ageGroupData = {};
        data.forEach(lead => {
            const ageGroup = getAgeGroup(parseInt(lead.ApproximateAge));
            const product = lead.ProductOffered;
            if (ageGroup !== 'N/A' && product) {
                if (!ageGroupData[ageGroup]) {
                    ageGroupData[ageGroup] = {};
                }
                if (!ageGroupData[ageGroup][product]) {
                    ageGroupData[ageGroup][product] = 0;
                }
                ageGroupData[ageGroup][product]++;
            }
        });

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Most Preferred Product by Age Group</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-purple-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">Age Group</th>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-purple-800 uppercase tracking-wider">Most Preferred Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-purple-800 uppercase tracking-wider">Count</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        const sortedAgeGroups = Object.keys(ageGroupData).sort();
        sortedAgeGroups.forEach(ageGroup => {
            const products = ageGroupData[ageGroup];
            const mostPreferred = Object.keys(products).reduce((a, b) => products[a] > products[b] ? a : b, '');
            const count = products[mostPreferred] || 0;
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${ageGroup}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-sm text-gray-500">${mostPreferred}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-purple-600">${count}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        preferredByAgeContainer.innerHTML = htmlContent;
    };

    const getIncomeGroup = (income) => {
        if (!income) return 'N/A';
        const normalizedIncome = income.toLowerCase();
        if (normalizedIncome.includes('lakhs')) {
            const lakhValue = parseFloat(normalizedIncome.replace(/[^0-9.]/g, ''));
            if (lakhValue <= 5) return 'Up to 5 Lakhs';
            if (lakhValue <= 10) return '5-10 Lakhs';
            return 'Over 10 Lakhs';
        }
        return 'Other';
    };

    const generatePreferredByIncomeReport = (data) => {
        const incomeGroupData = {};
        data.forEach(lead => {
            const incomeGroup = getIncomeGroup(lead.Averagemonthlycome);
            const product = lead.ProductOffered;
            if (incomeGroup !== 'N/A' && product) {
                if (!incomeGroupData[incomeGroup]) {
                    incomeGroupData[incomeGroup] = {};
                }
                if (!incomeGroupData[incomeGroup][product]) {
                    incomeGroupData[incomeGroup][product] = 0;
                }
                incomeGroupData[incomeGroup][product]++;
            }
        });

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Most Preferred Product by Income Group</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-yellow-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-yellow-800 uppercase tracking-wider">Income Group</th>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-yellow-800 uppercase tracking-wider">Most Preferred Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-yellow-800 uppercase tracking-wider">Count</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        const sortedIncomeGroups = Object.keys(incomeGroupData).sort();
        sortedIncomeGroups.forEach(incomeGroup => {
            const products = incomeGroupData[incomeGroup];
            const mostPreferred = Object.keys(products).reduce((a, b) => products[a] > products[b] ? a : b, '');
            const count = products[mostPreferred] || 0;
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${incomeGroup}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-sm text-gray-500">${mostPreferred}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-yellow-600">${count}</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        preferredByIncomeContainer.innerHTML = htmlContent;
    };

    const generateMostEasilyClosedReport = (data) => {
        const productData = {};
        data.forEach(lead => {
            const product = lead.ProductOffered;
            if (product) {
                if (!productData[product]) {
                    productData[product] = { total: 0, closed: 0 };
                }
                productData[product].total++;
                if (lead.LeadStatus === 'Closed') {
                    productData[product].closed++;
                }
            }
        });

        const conversionRates = Object.keys(productData).map(product => {
            const { total, closed } = productData[product];
            return {
                product: product,
                conversionRate: total > 0 ? (closed / total) * 100 : 0
            };
        });

        const sortedByConversion = conversionRates.sort((a, b) => b.conversionRate - a.conversionRate);

        let htmlContent = `
            <h3 class="text-xl font-bold text-gray-800 mb-4">Most Easily Closed Products (by Conversion Rate)</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 shadow-md rounded-lg overflow-hidden">
                    <thead class="bg-red-100">
                        <tr>
                            <th class="py-3 px-6 text-left text-sm font-semibold text-red-800 uppercase tracking-wider">Product</th>
                            <th class="py-3 px-6 text-center text-sm font-semibold text-red-800 uppercase tracking-wider">Conversion Rate</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">`;

        sortedByConversion.forEach(item => {
            htmlContent += `
                <tr>
                    <td class="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-900">${item.product}</td>
                    <td class="py-4 px-6 whitespace-nowrap text-center text-sm font-semibold text-red-600">${item.conversionRate.toFixed(2)}%</td>
                </tr>`;
        });
        htmlContent += `</tbody></table></div>`;
        mostEasilyClosedContainer.innerHTML = htmlContent;
    };

    const initProductReports = async () => {
        const allData = await fetchAndParseData();
        if (allData.length > 0) {
            generateMostPitchedReport(allData);
            generateMostClosedReport(allData);
            generatePreferredByAgeReport(allData);
            generatePreferredByIncomeReport(allData);
            generateMostEasilyClosedReport(allData);
            noDataMessage.classList.add('hidden');
        } else {
            noDataMessage.classList.remove('hidden');
            messageText.textContent = 'No data available to generate reports.';
        }
    };

    initProductReports();
});