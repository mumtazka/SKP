import html2pdf from 'html2pdf.js';

/**
 * Generates a comprehensive SKP PDF document with all sections.
 * Matches the official government format.
 * 
 * @param {Object} skp - The SKP data object
 * @param {Object} options - PDF generation options
 * @param {Object} options.evaluator - The official evaluator data
 * @param {Object} options.periodConfig - Period configuration from context
 * @param {Object} options.feedback - Feedback data for realisasi
 * @param {Array} options.perilakuRows - Perilaku kerja rows
 * @returns {Promise<void>}
 */
export const generateSKPFullPDF = async (skp, options = {}) => {
    const {
        evaluator = {},
        periodConfig = {},
        feedback = {},
        perilakuRows = []
    } = options;

    // Helper functions
    const stripHtml = (html) => {
        if (!html) return '-';
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '-';
    };

    const formatNIP = (nip) => {
        if (!nip) return '-';
        return nip.toString().replace(/^(NIP\.?|NIP|nip\.?|nip)\s*/i, '').trim();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Evaluator data resolution
    const evaluatorName = evaluator.fullName || skp.evaluator?.fullName || "_______________________";
    const evaluatorNIP = evaluator.identityNumber || skp.evaluator?.identityNumber || "...................";
    const evaluatorJabatan = evaluator.jabatan || skp.evaluator?.jabatan || "Pejabat Penilai Kinerja";
    const evaluatorPangkat = evaluator.pangkat || skp.evaluator?.pangkat || "-";
    const evaluatorUnit = evaluator.departmentName || skp.evaluator?.departmentName || "-";

    // Period resolution
    const year = skp.year || skp.period || periodConfig?.year || new Date().getFullYear();
    const startPeriod = periodConfig?.startDate
        ? formatDate(periodConfig.startDate)
        : `01 September ${year}`;
    const endPeriod = periodConfig?.endDate
        ? formatDate(periodConfig.endDate)
        : `31 Desember ${year}`;

    const signatureDate = skp.approvedAt
        ? formatDate(skp.approvedAt)
        : (skp.realisasiReviewedAt
            ? formatDate(skp.realisasiReviewedAt)
            : formatDate(new Date().toISOString()));

    // ===== HELPER RENDER FUNCTIONS =====

    const renderUserEvaluatorTable = () => `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
                <tr>
                    <th style="width: 5%; border: 1px solid #000; padding: 6px; text-align: center;">No</th>
                    <th style="width: 45%; border: 1px solid #000; padding: 6px; text-align: center;">Pegawai yang Dinilai</th>
                    <th style="width: 5%; border: 1px solid #000; padding: 6px; text-align: center;">No</th>
                    <th style="width: 45%; border: 1px solid #000; padding: 6px; text-align: center;">Pejabat Penilai Kinerja</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">1.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Nama</td><td style="border: none; padding: 2px;">${skp.user?.fullName || '-'}</td></tr>
                        </table>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">1.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Nama</td><td style="border: none; padding: 2px;">${evaluatorName}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">2.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">NIP</td><td style="border: none; padding: 2px;">${formatNIP(skp.user?.identityNumber)}</td></tr>
                        </table>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">2.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">NIP</td><td style="border: none; padding: 2px;">${formatNIP(evaluatorNIP)}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">3.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Pangkat / Gol.</td><td style="border: none; padding: 2px;">${skp.user?.pangkat || '-'}</td></tr>
                        </table>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">3.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Pangkat / Gol.</td><td style="border: none; padding: 2px;">${evaluatorPangkat}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">4.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Jabatan</td><td style="border: none; padding: 2px;">${skp.user?.jabatan || '-'}</td></tr>
                        </table>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">4.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Jabatan</td><td style="border: none; padding: 2px;">${evaluatorJabatan}</td></tr>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">5.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Unit Kerja</td><td style="border: none; padding: 2px;">${skp.user?.departmentName || '-'}</td></tr>
                        </table>
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top;">5.</td>
                    <td style="border: 1px solid #000; padding: 4px; vertical-align: top;">
                        <table style="width: 100%; border: none;">
                            <tr><td style="width: 80px; border: none; padding: 2px;">Unit Kerja</td><td style="border: none; padding: 2px;">${evaluatorUnit}</td></tr>
                        </table>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    // Render Hasil Kerja untuk bagian Sasaran (tanpa realisasi)
    const renderHasilKerjaSasaran = (rows, sectionLabel) => {
        if (!rows || rows.length === 0) return '';

        let html = `<div style="font-weight: bold; margin: 10px 0 5px 0;">${sectionLabel}</div>`;

        // Group rows by main row
        const groups = [];
        let currentGroup = null;
        let mainRowNumber = 0;

        rows.forEach((row, index) => {
            const isMainRow = !row.isSubRow;
            if (isMainRow) {
                mainRowNumber++;
                currentGroup = {
                    number: mainRowNumber,
                    mainText: stripHtml(row.columns?.[0] || ''),
                    subRows: []
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                currentGroup.subRows.push(stripHtml(row.columns?.[0] || ''));
            }
        });

        groups.forEach(group => {
            html += `<div style="margin-bottom: 10px; padding-left: 10px;">
                <div style="font-weight: bold;">${group.number}. ${group.mainText}</div>`;

            if (group.subRows.length > 0) {
                html += `<div style="margin-top: 5px; padding-left: 15px;">
                    <span style="font-style: italic;">Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:</span>
                    <ul style="margin: 5px 0; padding-left: 20px;">`;
                group.subRows.forEach(sub => {
                    html += `<li>${sub}</li>`;
                });
                html += `</ul></div>`;
            }
            html += `</div>`;
        });

        return html;
    };

    // Render Perilaku Kerja table
    const renderPerilakuKerjaTable = (rows) => {
        if (!rows || rows.length === 0) return '<tr><td colspan="3" style="text-align: center; padding: 10px;">Tidak ada data</td></tr>';

        let html = '';
        let mainRowNumber = 0;

        rows.forEach((row) => {
            const isMain = !row.isSubRow;
            const col0 = stripHtml(row.columns?.[0] || '');
            const col1 = stripHtml(row.columns?.[1] || '');

            if (isMain) {
                mainRowNumber++;
                const rowSpan = row.rowSpans?.[1] || 1;
                html += `<tr>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top; width: 35px;">${mainRowNumber}.</td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top;"><strong>${col0}</strong></td>
                    <td rowspan="${rowSpan}" style="border: 1px solid #000; padding: 6px; vertical-align: top; width: 35%; font-style: italic;">${col1}</td>
                </tr>`;
            } else {
                const isCol1Hidden = row.colHiddens?.includes(1);
                html += `<tr>
                    <td style="border: 1px solid #000; padding: 6px;"></td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top; padding-left: 20px;">• ${col0}</td>
                    ${!isCol1Hidden ? `<td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${col1}</td>` : ''}
                </tr>`;
            }
        });

        return html;
    };

    // Render Lampiran simple table
    const renderLampiranTable = (rows, title) => {
        if (!rows || rows.length === 0) return '';

        let html = `<div style="font-weight: bold; margin: 10px 0 5px 0;">${title}</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">`;

        rows.forEach((row, index) => {
            const text = stripHtml(row.columns?.[0] || '');
            if (text && text !== '-') {
                html += `<tr>
                    <td style="border: 1px solid #000; padding: 6px; width: 30px; text-align: center; vertical-align: top;">${index + 1}.</td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${text}</td>
                </tr>`;
            }
        });

        html += `</table>`;
        return html;
    };

    // Render dual signature
    const renderDualSignature = () => `
        <div style="display: flex; justify-content: space-between; margin-top: 40px; page-break-inside: avoid;">
            <div style="width: 45%; text-align: center;">
                <div style="margin-bottom: 70px;">
                    <br/>
                    Pegawai yang Dinilai,
                </div>
                <div style="font-weight: bold; text-decoration: underline;">${skp.user?.fullName || ''}</div>
                <div>NIP. ${formatNIP(skp.user?.identityNumber)}</div>
            </div>
            <div style="width: 45%; text-align: center;">
                <div style="margin-bottom: 70px;">
                    ${signatureDate}
                    <br/>
                    Pejabat Penilai Kinerja,
                </div>
                <div style="font-weight: bold; text-decoration: underline;">${evaluatorName}</div>
                <div>NIP. ${formatNIP(evaluatorNIP)}</div>
            </div>
        </div>
    `;

    // Render single signature (evaluator only)
    const renderSingleSignature = () => `
        <div style="margin-top: 40px; page-break-inside: avoid; text-align: right;">
            <div style="display: inline-block; text-align: center; width: 250px;">
                <div style="margin-bottom: 70px;">
                    ${signatureDate}
                    <br/>
                    Pejabat Penilai Kinerja,
                </div>
                <div style="font-weight: bold; text-decoration: underline;">${evaluatorName}</div>
                <div>NIP. ${formatNIP(evaluatorNIP)}</div>
            </div>
        </div>
    `;

    // Render Hasil Kerja dengan Realisasi untuk Evaluasi
    const renderHasilKerjaEvaluasi = (planRows, realisasiRows, feedbackData) => {
        if (!planRows || planRows.length === 0) {
            return '<tr><td colspan="4" style="text-align: center; padding: 12px;">Tidak ada data</td></tr>';
        }

        const groups = [];
        let mainRowCounter = 0;
        let currentGroup = null;

        planRows.forEach((row, index) => {
            const isMainRow = !row.isSubRow;
            if (isMainRow) {
                mainRowCounter++;
                currentGroup = {
                    number: mainRowCounter,
                    rows: [{ ...row, originalIndex: index }],
                    startIndex: index
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                currentGroup.rows.push({ ...row, originalIndex: index });
            }
        });

        return groups.map((group) => {
            let planContentHTML = '';
            const mainRow = group.rows[0];
            const mainText = stripHtml(mainRow.columns?.[0] || '');
            planContentHTML += `<div style="margin-bottom: 8px;"><strong>${group.number}. ${mainText}</strong></div>`;

            if (group.rows.length > 1) {
                planContentHTML += `<div style="margin-bottom: 4px; font-style: italic;">Ukuran keberhasilan / Indikator Kinerja Individu, dan Target:</div>`;
                planContentHTML += `<ul style="margin: 0; padding-left: 20px; list-style-type: disc;">`;
                for (let i = 1; i < group.rows.length; i++) {
                    const subRow = group.rows[i];
                    const subText = stripHtml(subRow.columns?.[0] || '');
                    planContentHTML += `<li>${subText}</li>`;
                }
                planContentHTML += `</ul>`;
            }

            const realisasiText = realisasiRows?.[group.startIndex]?.realisasi || '-';
            const umpanBalikText = feedbackData?.[group.startIndex]?.umpanBalik || '-';

            return `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: top; width: 30px;">${group.number}</td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${planContentHTML}</td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${realisasiText}</td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top;">${umpanBalikText}</td>
                </tr>
            `;
        }).join('');
    };

    // Generate distribution chart SVG
    const generateDistributionChart = () => {
        // Calculate counts from ratings
        const counts = {
            'Sangat Kurang': 0,
            'Kurang/Misconduct': 0,
            'Butuh Perbaikan': 0,
            'Baik': 0,
            'Sangat Baik': 0
        };

        const allItems = [
            ...(skp.realisasi?.utama || []),
            ...(skp.realisasi?.tambahan || [])
        ];

        allItems.forEach(item => {
            if (!item || !item.rating) return;
            const r = item.rating.toLowerCase();
            if (r.includes('sangat buruk') || r.includes('sangat kurang')) counts['Sangat Kurang']++;
            else if (r.includes('buruk') || r.includes('kurang') || r.includes('misconduct')) counts['Kurang/Misconduct']++;
            else if (r.includes('cukup') || r.includes('butuh perbaikan')) counts['Butuh Perbaikan']++;
            else if (r.includes('sangat baik')) counts['Sangat Baik']++;
            else if (r.includes('baik')) counts['Baik']++;
        });

        // Determine dominant category
        let dominantCategory = 'Baik';
        let maxCount = -1;
        Object.entries(counts).forEach(([cat, count]) => {
            if (count > maxCount) {
                maxCount = count;
                dominantCategory = cat;
            }
        });

        // Path templates
        const templates = {
            'Sangat Baik': {
                path: "M50,100 C350,100 420,80 450,10",
                fill: "M50,100 C350,100 420,80 450,10 L450,100 L50,100 Z"
            },
            'Baik': {
                path: "M50,100 C250,100 300,20 350,20 C400,20 450,80 450,80",
                fill: "M50,100 C250,100 300,20 350,20 C400,20 450,80 450,80 L450,100 L50,100 Z"
            },
            'Butuh Perbaikan': {
                path: "M50,100 C80,100 150,20 250,20 C350,20 420,100 450,100",
                fill: "M50,100 C80,100 150,20 250,20 C350,20 420,100 450,100 L450,100 L50,100 Z"
            },
            'Kurang/Misconduct': {
                path: "M50,80 C50,80 100,20 150,20 C200,20 250,100 450,100",
                fill: "M50,80 C50,80 100,20 150,20 C200,20 250,100 450,100 L450,100 L50,100 Z"
            },
            'Sangat Kurang': {
                path: "M50,10 C80,80 180,100 450,100",
                fill: "M50,10 C80,80 180,100 450,100 L450,100 L50,100 Z"
            }
        };

        const template = templates[dominantCategory] || templates['Baik'];
        const svgWidth = 500;
        const svgHeight = 120;
        const graphBottomY = 100;

        return `
            <svg width="${svgWidth}" height="${svgHeight + 50}" viewBox="0 0 ${svgWidth} ${svgHeight + 50}" style="overflow: visible;">
                <!-- X Axis -->
                <line x1="0" y1="${graphBottomY}" x2="${svgWidth}" y2="${graphBottomY}" stroke="black" stroke-width="1" />
                
                <!-- Area Fill -->
                <path d="${template.fill}" fill="#ecfdf5" opacity="0.5" />

                <!-- Curve -->
                <path d="${template.path}" fill="none" stroke="black" stroke-width="2" />
                
                <!-- Labels -->
                <text x="50" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="9" text-anchor="middle">Sangat</text>
                <text x="50" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="9" text-anchor="middle">Kurang</text>
                
                <text x="150" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="9" text-anchor="middle">Kurang/</text>
                <text x="150" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="9" text-anchor="middle">Misconduct</text>
                
                <text x="250" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="9" text-anchor="middle">Butuh</text>
                <text x="250" y="${graphBottomY + 25}" font-family="Times New Roman" font-size="9" text-anchor="middle">Perbaikan</text>
                
                <text x="350" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="9" text-anchor="middle">Baik</text>
                 
                <text x="450" y="${graphBottomY + 15}" font-family="Times New Roman" font-size="9" text-anchor="middle">Sangat Baik</text>
                
                <text x="250" y="${graphBottomY + 45}" font-family="Times New Roman" font-size="10" text-anchor="middle">Predikat Kinerja Pegawai</text>
            </svg>
        `;
    };

    // ===== BUILD FULL PDF HTML =====

    const element = document.createElement('div');
    element.innerHTML = `
        <style>
            @page { size: A4; margin: 15mm 15mm 15mm 15mm; }
            body { font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.4; font-size: 11pt; }
            table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td, th { border: 1px solid #000; padding: 6px; vertical-align: top; word-wrap: break-word; }
            .page-break { page-break-before: always; }
            .section-title { font-weight: bold; margin: 15px 0 10px 0; }
        </style>

        <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.4; font-size: 11pt;">
            
            <!-- ================= BAGIAN 1: SASARAN KINERJA PEGAWAI ================= -->
            <div style="margin-bottom: 20px; position: relative;">
                <div style="position: absolute; left: 0; top: 0; font-size: 10pt;">
                    Kementerian Pendidikan Tinggi, Sains dan Teknologi
                </div>
                <div style="text-align: right; font-size: 10pt;">
                    Periode: ${startPeriod} s/d ${endPeriod}
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px; margin-top: 30px;">
                <h2 style="font-size: 13pt; font-weight: bold; margin: 0;">SASARAN KINERJA PEGAWAI</h2>
                <h3 style="font-size: 12pt; font-weight: bold; margin: 3px 0;">PENDEKATAN HASIL KERJA KUALITATIF</h3>
                <h3 style="font-size: 12pt; font-weight: bold; margin: 3px 0;">BAGI PEJABAT ADMINISTRASI / FUNGSIONAL</h3>
            </div>

            ${renderUserEvaluatorTable()}

            <!-- HASIL KERJA -->
            <div style="font-weight: bold; font-size: 12pt; margin: 20px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px;">HASIL KERJA</div>
            
            ${renderHasilKerjaSasaran(skp.details?.utama, 'A. Utama')}
            ${renderHasilKerjaSasaran(skp.details?.tambahan, 'B. Tambahan')}

            <!-- PERILAKU KERJA (Page 2) -->
            <div class="page-break"></div>
            <div style="font-weight: bold; font-size: 12pt; margin: 20px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px;">PERILAKU KERJA</div>
            
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #000; padding: 8px; width: 35px; text-align: center;">No</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left;">Perilaku Kerja</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 35%;">Ekspektasi Khusus Pimpinan</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderPerilakuKerjaTable(perilakuRows)}
                </tbody>
            </table>

            ${renderDualSignature()}

            <!-- ================= BAGIAN 2: LAMPIRAN ================= -->
            <div class="page-break"></div>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="font-size: 13pt; font-weight: bold; margin: 0;">LAMPIRAN SASARAN KINERJA PEGAWAI</h2>
            </div>

            ${renderLampiranTable(skp.details?.dukungan, 'Dukungan Sumber Daya')}
            ${renderLampiranTable(skp.details?.skema, 'Skema Pertanggungjawaban')}
            ${renderLampiranTable(skp.details?.konsekuensi, 'Konsekuensi')}

            ${renderDualSignature()}

            <!-- ================= BAGIAN 3: EVALUASI KINERJA ================= -->
            <div class="page-break"></div>
            
            <div style="margin-bottom: 20px; position: relative;">
                <div style="position: absolute; left: 0; top: 0; font-size: 10pt;">
                    Kementerian Pendidikan Tinggi, Sains dan Teknologi
                </div>
                <div style="text-align: right; font-size: 10pt;">
                    Periode: ${startPeriod} s/d ${endPeriod}
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 20px; margin-top: 30px;">
                <h2 style="font-size: 13pt; font-weight: bold; margin: 0;">EVALUASI KINERJA PEGAWAI</h2>
                <h3 style="font-size: 12pt; font-weight: bold; margin: 3px 0;">PENDEKATAN HASIL KERJA KUALITATIF</h3>
                <h3 style="font-size: 12pt; font-weight: bold; margin: 3px 0;">BAGI PEJABAT ADMINISTRASI / FUNGSIONAL</h3>
                <p style="font-size: 11pt; margin: 5px 0;">PERIODE: TRIWULAN I/II/III/IV-AKHIR*</p>
            </div>

            ${renderUserEvaluatorTable()}

            <!-- CAPAIAN KINERJA -->
            <div style="border: 1px solid #000; padding: 8px; margin-bottom: 0;">
                <span style="font-weight: bold;">CAPAIAN KINERJA ORGANISASI:</span> ${skp.predikatAkhir || 'BAIK'}
            </div>

            <!-- POLA DISTRIBUSI -->
            <div style="border: 1px solid #000; border-top: none; padding: 10px; margin-bottom: 20px;">
                <div style="font-weight: bold; margin-bottom: 5px;">POLA DISTRIBUSI:</div>
                <div style="display: flex; justify-content: center; align-items: flex-end; height: 130px; padding-bottom: 20px;">
                    ${generateDistributionChart()}
                </div>
            </div>

            <!-- HASIL KERJA EVALUASI -->
            <div style="font-weight: bold; font-size: 12pt; margin: 20px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px;">HASIL KERJA</div>

            <div style="font-weight: bold; margin: 10px 0 5px 0;">A. Utama</div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #000; padding: 6px; width: 30px; text-align: center;">No</th>
                        <th style="border: 1px solid #000; padding: 6px;">Rencana Hasil Kerja</th>
                        <th style="border: 1px solid #000; padding: 6px;">Realisasi Berdasarkan Bukti Dukung</th>
                        <th style="border: 1px solid #000; padding: 6px;">Umpan Balik Berkelanjutan</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderHasilKerjaEvaluasi(skp.details?.utama, skp.realisasi?.utama, feedback.utama)}
                </tbody>
            </table>

            ${skp.details?.tambahan && skp.details.tambahan.length > 0 ? `
                <div style="font-weight: bold; margin: 10px 0 5px 0;">B. Tambahan</div>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <thead>
                        <tr style="background-color: #f5f5f5;">
                            <th style="border: 1px solid #000; padding: 6px; width: 30px; text-align: center;">No</th>
                            <th style="border: 1px solid #000; padding: 6px;">Rencana Hasil Kerja</th>
                            <th style="border: 1px solid #000; padding: 6px;">Realisasi Berdasarkan Bukti Dukung</th>
                            <th style="border: 1px solid #000; padding: 6px;">Umpan Balik Berkelanjutan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderHasilKerjaEvaluasi(skp.details?.tambahan, skp.realisasi?.tambahan, feedback.tambahan)}
                    </tbody>
                </table>
            ` : ''}

            <!-- PERILAKU KERJA EVALUASI -->
            <div style="font-weight: bold; font-size: 12pt; margin: 20px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px;">PERILAKU KERJA</div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="border: 1px solid #000; padding: 8px; width: 35px; text-align: center;">No</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left;">Perilaku Kerja</th>
                        <th style="border: 1px solid #000; padding: 8px; text-align: left; width: 35%;">Ekspektasi Khusus Pimpinan</th>
                    </tr>
                </thead>
                <tbody>
                    ${renderPerilakuKerjaTable(perilakuRows)}
                </tbody>
            </table>

            <!-- RATING FINAL -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; width: 300px; font-weight: bold; background-color: #f5f5f5;">
                        RATING PERILAKU
                    </td>
                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">
                        Diatas Ekspektasi
                    </td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 8px; width: 300px; font-weight: bold; background-color: #f5f5f5;">
                        PREDIKAT KINERJA PEGAWAI
                    </td>
                    <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">
                        ${skp.predikatAkhir || 'BAIK'}
                    </td>
                </tr>
            </table>

            ${renderSingleSignature()}

        </div>
    `;

    const opt = {
        margin: [15, 15, 15, 15],
        filename: `SKP_${year}_${skp.user?.fullName?.replace(/\s+/g, '_') || 'User'} (${skp.user?.jabatan || 'Pegawai'}).pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    return html2pdf().set(opt).from(element).save();
};

export default generateSKPFullPDF;
