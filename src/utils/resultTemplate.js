export const generateResultHTML = (student, result) => {
    // Format the exam date for a cleaner look (e.g., "December 15, 2025")
    const formattedDate = new Date(result.examDate).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const subjectsHTML = result.subjects
        .map(
            (sub) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${sub.name}</td>
          <td style="padding:8px;border:1px solid #ddd;">${sub.totalMarks}</td>
          <td style="padding:8px;border:1px solid #ddd;">${sub.marksObtained}</td>
        </tr>
      `
        )
        .join("");

    return `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th {
          background: #f0f0f0;
          padding: 10px;
          border: 1px solid #ddd;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 14px;
        }
      </style>
    </head>

    <body>

      <div class="header">
        <h1>Nymph Classes</h1>
        <h3>Student Result</h3>
      </div>

      <div>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>Standard:</strong> ${student.standard}</p>
        <p><strong>Roll No:</strong> ${student.rollNumber}</p>
        <p><strong>Exam Date:</strong> ${formattedDate}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Subject</th>
            <th>Total Marks</th>
            <th>Marks Obtained</th>
          </tr>
        </thead>
        <tbody>
          ${subjectsHTML}
        </tbody>
      </table>

      <h3 style="margin-top:20px;">Total: ${result.totalObtained} / ${result.totalMaximum}</h3>
      <h3>Percentage: ${result.percentage}%</h3>
      <h3>Grade: ${result.grade}</h3>

      <div class="footer">
        © ${new Date().getFullYear()} Nymph Classes — Powered by Nymph Result System
      </div>

    </body>
  </html>
  `;
};