document.addEventListener('DOMContentLoaded', () => {
    const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQLQU5H8LeHi8Xzx1ZuBpyRa9X7hgqIn8IFo6eVP0NdpfpUHM0MuEYd1sddxjkf2KXeyo07663Eg7xD/pub?gid=415786587&single=true&output=csv';

    const branchSelect = document.getElementById('branch-select');
    const employeeSelect = document.getElementById('employee-select');
    const customerSelect = document.getElementById('customer-select');
    const customerDetailsDiv = document.getElementById('customer-details');
    const noDataMessage = document.getElementById('no-data-message');
    const messageText = document.getElementById('message-text');

    let allData = [];

    // This new function provides a robust way to parse CSV rows, handling commas inside quoted fields.
    const parseCSVRow = (row) => {
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
        return values;
    };

    const fetchAndParseData = async () => {
        try {
            const response = await fetch(CSV_URL);
            const csvText = await response.text();
            
            const rows = csvText.split('\n').filter(row => row.trim() !== '');
            const headers = parseCSVRow(rows[0]).map(header => header.trim().replace(/[^a-zA-Z0-9]/g, ''));

            const parsedData = rows.slice(1).map(row => {
                const values = parseCSVRow(row);
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i] || '';
                });
                return obj;
            });

            allData = parsedData;
            populateBranches(allData);
            messageText.textContent = "Please select an employee and customer from the dropdown menus.";
            noDataMessage.classList.remove('hidden');
            customerDetailsDiv.classList.add('hidden');

        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            messageText.textContent = "Failed to load data. Please try again later.";
        }
    };

    const populateBranches = (data) => {
        const branches = [...new Set(data.map(item => item.BRANCHNAME).filter(Boolean))];
        branchSelect.innerHTML = `<option value="" disabled selected>-- Select Branch --</option>`;
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch;
            option.textContent = branch;
            branchSelect.appendChild(option);
        });
        branchSelect.addEventListener('change', () => populateEmployees(data, branchSelect.value));
    };

    const populateEmployees = (data, branchName) => {
        const employees = [...new Set(data.filter(item => item.BRANCHNAME === branchName).map(item => item.EMPLOYEENAME).filter(Boolean))];
        employeeSelect.innerHTML = `<option value="" disabled selected>-- Select Employee --</option>`;
        employees.forEach(employee => {
            const option = document.createElement('option');
            option.value = employee;
            option.textContent = employee;
            employeeSelect.appendChild(option);
        });
        employeeSelect.disabled = false;
        customerSelect.disabled = true;
        customerSelect.innerHTML = `<option value="" disabled selected>-- Select Customer --</option>`;
        hideAllContent();
        employeeSelect.addEventListener('change', () => populateCustomers(data, branchName, employeeSelect.value));
    };

    const populateCustomers = (data, branchName, employeeName) => {
        const customers = data.filter(item => item.BRANCHNAME === branchName && item.EMPLOYEENAME === employeeName).map(item => item.CustomerName).filter(Boolean);
        customerSelect.innerHTML = `<option value="" disabled selected>-- Select Customer --</option>`;
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer;
            option.textContent = customer;
            customerSelect.appendChild(option);
        });
        customerSelect.disabled = false;
        hideAllContent();
        customerSelect.addEventListener('change', () => {
            const customerName = customerSelect.value;
            const customerData = data.find(item => item.BRANCHNAME === branchName && item.EMPLOYEENAME === employeeName && item.CustomerName === customerName);
            if (customerData) {
                renderCustomerDetails(customerData);
            }
        });
    };

    const hideAllContent = () => {
        customerDetailsDiv.classList.add('hidden');
        noDataMessage.classList.remove('hidden');
        messageText.textContent = "Please select a customer to view their details.";
    };

    const renderCustomerDetails = (data) => {
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
            ],
            "Lead Status & Follow-up": [
                { key: 'ProductDiscussed', label: 'Product Discussed' },                 
                { key: 'ClosedAmount', label: 'Closed Amount' },
                { key: 'Howmanyvisitcompleted', label: 'Number of Visits Completed' },
                { key: 'VisitDays', label: 'Visit Days' },
                { key: 'Mention2ndvisit', label: 'Mention 2nd Visit' },
                { key: 'Mention3rdvisit', label: 'Mention 3rd Visit' },
                { key: 'Mention4thvisit', label: 'Mention 4th Visit' },
                { key: 'Remark1', label: 'Remark 1' },
                { key: 'Remark2', label: 'Remark 2' },
                { key: 'Remark3', label: 'Remark 3' },
                { key: 'Remark4', label: 'Remark 4' },
                { key: 'Rmark5', label: 'Remark 5' },
                { key: 'LeadStatus', label: 'Lead Status' }
            ]
        };

        const sectionGroups = [
            ["Lead & Employee Info", "Job & Income"],
            ["Customer Contact Details", "Personal & Family Details"],
            ["Lead Status & Follow-up"]
        ];

        let htmlContent = '';
        sectionGroups.forEach(group => {
            const groupClasses = group.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2';
            htmlContent += `<div class="grid grid-cols-1 ${groupClasses} gap-8 mb-8">`;
            group.forEach(sectionTitle => {
                const sectionItems = sections[sectionTitle];
                if (sectionItems) {
                    htmlContent += `<div class="detail-card ${sectionTitle.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')
}">
                        <h3 class="text-xl font-semibold">${sectionTitle}</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">`;
                    sectionItems.forEach(item => {
                        const value = data[item.key] || 'N/A';
                        htmlContent += `
                            <div class="detail-item">
                                <p class="text-sm font-medium text-gray-500">${item.label}</p>
                                <p class="mt-1 text-base font-semibold text-gray-900">${value}</p>
                            </div>`;
                    });
                    htmlContent += `</div></div>`;
                }
            });
            htmlContent += `</div>`;
        });
        customerDetailsDiv.innerHTML = htmlContent;
        customerDetailsDiv.classList.remove('hidden');
        noDataMessage.classList.add('hidden');
    };

    fetchAndParseData();
});