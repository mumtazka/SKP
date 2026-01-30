import { useMemo } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, BarChart3 } from 'lucide-react';

const DistributionChart = ({ skpHistory, userName }) => {
    // Helper: Konversi Predikat ke Nilai Angka untuk Grafik
    const getScoreFromPredicate = (predicate) => {
        if (!predicate) return 0;
        const p = String(predicate).toLowerCase().trim();
        if (p.includes('sangat baik')) return 5;
        if (p.includes('baik')) return 4;
        if (p.includes('cukup')) return 3;
        if (p.includes('kurang') || p.includes('buruk')) return 2;
        if (p.includes('sangat kurang') || p.includes('sangat buruk')) return 1;
        return 0;
    };

    const getLabelFromScore = (score) => {
        if (score >= 4.5) return 'Sangat Baik';
        if (score >= 3.5) return 'Baik';
        if (score >= 2.5) return 'Cukup';
        if (score >= 1.5) return 'Buruk';
        if (score >= 0.5) return 'Sangat Buruk';
        return '-';
    };

    // Extract rating dari realisasi JSON
    const extractRatingData = (realisasi) => {
        if (!realisasi) return null;
        try {
            const data = typeof realisasi === 'string' ? JSON.parse(realisasi) : realisasi;

            // Prioritas 1: Properti 'rating' (bisa angka atau string)
            if (data.rating !== undefined && data.rating !== null) {
                const val = data.rating;
                // Jika angka, return langsung (skala 100)
                if (typeof val === 'number') return { value: val, type: 'numeric', raw: val };
                // Jika string, mapping ke score 1-5
                return { value: getScoreFromPredicate(val), type: 'predicate', raw: val };
            }

            // Prioritas 2: Coba cari 'nilai' atau 'predikat'
            if (data.predikat) return { value: getScoreFromPredicate(data.predikat), type: 'predicate', raw: data.predikat };
            if (data.nilai) return { value: getScoreFromPredicate(data.nilai), type: 'predicate', raw: data.nilai };

            // Prioritas 3: Cari di details jika ada
            // Misal user punya nilai per kegiatan di details.utama -> ambil rata-rata modus
            // Ini kompleks, tapi kita coba deteksi pattern sederhana
            // Untuk sekarang kita asumsikan ada properti di root level sesuai request user

            return null;
        } catch (error) {
            console.error("Error parsing realisasi for chart:", error);
            return null;
        }
    };

    // Process data untuk line chart
    const chartData = useMemo(() => {
        if (!skpHistory || skpHistory.length === 0) return [];

        return skpHistory
            .map(skp => {
                const ratingInfo = extractRatingData(skp.realisasi);
                if (!ratingInfo) return null;

                return {
                    year: skp.year || skp.period || new Date(skp.createdAt).getFullYear().toString(),
                    score: ratingInfo.value,
                    rawRating: ratingInfo.raw,
                    type: ratingInfo.type,
                    reviewedAt: skp.realisasiReviewedAt || skp.updatedAt,
                    activity: skp.activity // Optional context
                };
            })
            .filter(item => item !== null)
            .sort((a, b) => {
                // Sort by year/period
                if (a.year !== b.year) return a.year.localeCompare(b.year);
                return new Date(a.reviewedAt) - new Date(b.reviewedAt);
            })
            .map((item, index) => ({
                ...item,
                index: index + 1,
                label: item.year
            }));
    }, [skpHistory]);

    // Hitung distribusi rating
    const ratingDistribution = useMemo(() => {
        if (!chartData || chartData.length === 0) return {};

        const distribution = {
            'Sangat Baik': 0,
            'Baik': 0,
            'Cukup': 0,
            'Buruk': 0,
            'Sangat Buruk': 0
        };

        chartData.forEach(item => {
            let category = '-';

            if (item.type === 'predicate') {
                // Normalize string case
                const raw = String(item.rawRating).toLowerCase() || '';
                if (raw.includes('sangat baik')) category = 'Sangat Baik';
                else if (raw.includes('baik')) category = 'Baik';
                else if (raw.includes('cukup')) category = 'Cukup';
                else if (raw.includes('sangat buruk') || raw.includes('sangat kurang')) category = 'Sangat Buruk';
                else if (raw.includes('buruk') || raw.includes('kurang')) category = 'Buruk';
            } else {
                // Numeric mapping
                if (item.score >= 91) category = 'Sangat Baik';
                else if (item.score >= 76) category = 'Baik';
                else if (item.score >= 61) category = 'Cukup';
                else if (item.score >= 51) category = 'Buruk';
                else category = 'Sangat Buruk';
            }

            if (distribution[category] !== undefined) {
                distribution[category]++;
            }
        });

        return distribution;
    }, [chartData]);

    // Hitung statistik
    const statistics = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;

        const scores = chartData.map(item => item.score);
        const total = scores.length;

        // Average calculation handles both numeric scales (0-100) and predicate scales (1-5)
        // We'll normalize for display based on the dominant type
        const isMostlyPredicates = chartData.filter(i => i.type === 'predicate').length > total / 2;

        const sum = scores.reduce((acc, val) => acc + val, 0);
        const avg = sum / total;

        let avgDisplay = avg.toFixed(1);
        let maxDisplay = Math.max(...scores);
        let minDisplay = Math.min(...scores);

        if (isMostlyPredicates) {
            // If predicate driven, convert back to label for display
            avgDisplay = getLabelFromScore(avg);
            maxDisplay = getLabelFromScore(maxDisplay);
            minDisplay = getLabelFromScore(minDisplay);
        }

        return {
            total,
            average: avgDisplay,
            max: maxDisplay,
            min: minDisplay,
            lastRating: chartData[chartData.length - 1].rawRating
        };
    }, [chartData]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-gray-100 rounded-lg shadow-xl text-sm">
                    <p className="font-bold text-gray-900 mb-1">{data.year}</p>
                    <p className="text-gray-600">
                        <span className="font-medium text-primary">Rating:</span> {data.rawRating}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        {data.reviewedAt ? new Date(data.reviewedAt).toLocaleDateString('id-ID') : '-'}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!chartData || chartData.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <BarChart3 className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-900">Belum ada data grafik</p>
                    <p className="text-sm text-gray-500 max-w-sm mt-1">
                        Pilih user yang memiliki SKP dengan status "Approved" (Nilai Realisasi) untuk melihat analisis.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>Total Periode</CardDescription>
                        <CardTitle className="text-2xl">{statistics.total}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>Rata-rata</CardDescription>
                        <CardTitle className="text-xl md:text-2xl text-primary truncate" title={statistics.average}>
                            {statistics.average}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>Capaian Terbaik</CardDescription>
                        <CardTitle className="text-xl md:text-2xl text-green-600 truncate" title={statistics.max}>
                            {statistics.max}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>Terakhir</CardDescription>
                        <CardTitle className="text-xl md:text-2xl text-blue-600 truncate" title={statistics.lastRating}>
                            {statistics.lastRating}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <TrendingUp className="h-4 w-4 text-gray-500" />
                            Tren Kualitas Kinerja
                        </CardTitle>
                        <CardDescription>Perkembangan rating SKP {userName} dari waktu ke waktu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        hide // Hide Y Axis numbers if using predicates
                                        domain={[0, 'auto']}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    <Line
                                        type="monotone"
                                        dataKey="score"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{ fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, fill: '#8b5cf6' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Bars */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Award className="h-4 w-4 text-gray-500" />
                            Distribusi Rating
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(ratingDistribution).map(([category, count]) => {
                                if (count === 0) return null; // Only show present categories

                                const percentage = ((count / statistics.total) * 100).toFixed(0);
                                let colorClass = 'bg-gray-200';

                                if (category === 'Sangat Baik') colorClass = 'bg-emerald-500';
                                else if (category === 'Baik') colorClass = 'bg-blue-500';
                                else if (category === 'Cukup') colorClass = 'bg-yellow-500';
                                else colorClass = 'bg-red-500';

                                return (
                                    <div key={category} className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-700">{category}</span>
                                            <span className="text-gray-500">{count}x ({percentage}%)</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DistributionChart;
