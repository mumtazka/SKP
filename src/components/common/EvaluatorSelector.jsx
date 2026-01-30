import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEvaluator } from '@/context/EvaluatorContext';
import { api } from '@/services/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { UserCog, Check, ChevronsUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EvaluatorSelector = ({
    title = "Pilih Kepegawaian (Penilai)",
    description = "Sebagai admin, pilih kepegawaian yang ingin Anda monitor",
    className = ""
}) => {
    const { user } = useAuth();
    const { selectedEvaluatorId, setSelectedEvaluatorId, setSelectedEvaluator } = useEvaluator();
    const [evaluators, setEvaluators] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load daftar kepegawaian
    useEffect(() => {
        const loadEvaluators = async () => {
            setLoading(true);
            try {
                const users = await api.users.getAll();
                // Filter hanya kepegawaian
                const kepegawaianList = users.filter(u => u.role === 'kepegawaian');
                setEvaluators(kepegawaianList);

                // Auto-select jika hanya ada 1 kepegawaian
                if (kepegawaianList.length === 1 && !selectedEvaluatorId) {
                    setSelectedEvaluatorId(kepegawaianList[0].id);
                    setSelectedEvaluator(kepegawaianList[0]);
                }
            } catch (error) {
                console.error('Error loading evaluators:', error);
            } finally {
                setLoading(false);
            }
        };

        // Hanya admin yang perlu load evaluators
        if (user?.role === 'admin' || user?.role === 'superadmin') {
            loadEvaluators();
        } else {
            setLoading(false);
        }
    }, [user, selectedEvaluatorId, setSelectedEvaluatorId, setSelectedEvaluator]);

    // Jika bukan admin, tidak perlu tampilkan selector
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return null;
    }

    // Handle select evaluator
    const handleSelectEvaluator = (evaluatorId) => {
        const evaluator = evaluators.find(e => e.id === evaluatorId);
        setSelectedEvaluatorId(evaluatorId);
        setSelectedEvaluator(evaluator);
        setOpen(false);
    };

    return (
        <Card className={cn("border-l-4 border-l-primary", className)}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                        Memuat data kepegawaian...
                    </div>
                ) : evaluators.length === 0 ? (
                    <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-medium">Belum ada Kepegawaian</p>
                            <p className="text-sm">Silakan tambahkan user dengan role Kepegawaian terlebih dahulu.</p>
                        </div>
                    </div>
                ) : (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between h-auto py-3"
                            >
                                {selectedEvaluatorId ? (
                                    <div className="flex flex-col items-start gap-1 text-left">
                                        <span className="font-medium">
                                            {evaluators.find(e => e.id === selectedEvaluatorId)?.fullName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            NIP: {evaluators.find(e => e.id === selectedEvaluatorId)?.identityNumber || '-'} |
                                            {' '}{evaluators.find(e => e.id === selectedEvaluatorId)?.jabatan || 'Kepegawaian'}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground">Pilih Kepegawaian...</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Cari nama atau NIP..." />
                                <CommandList>
                                    <CommandEmpty>Tidak ada kepegawaian ditemukan.</CommandEmpty>
                                    <CommandGroup heading="Daftar Kepegawaian">
                                        {evaluators.map((evaluator) => (
                                            <CommandItem
                                                key={evaluator.id}
                                                value={`${evaluator.fullName} ${evaluator.identityNumber || ''}`}
                                                onSelect={() => handleSelectEvaluator(evaluator.id)}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedEvaluatorId === evaluator.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-medium">{evaluator.fullName}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        NIP: {evaluator.identityNumber || '-'} | {evaluator.jabatan || 'Kepegawaian'}
                                                    </span>
                                                    {evaluator.department && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {evaluator.department.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}

                {selectedEvaluatorId && !loading && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <span className="font-medium">Monitoring sebagai:</span> {evaluators.find(e => e.id === selectedEvaluatorId)?.fullName}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Data yang ditampilkan adalah data SKP yang dinilai oleh kepegawaian ini.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default EvaluatorSelector;
