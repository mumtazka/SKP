import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Menu, User as UserIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Note: Shadcn dropdown would be ideal, but for now implementing a simple one or assuming Shadcn is NOT fully installed yet.
// Since Shadcn libraries were not explicitly run (npx shadcn-ui@latest init), I will build a standard custom dropdown to be safe without external complex deps if possible, OR I will assume I can use a simple custom one. 
// Wait, package.json HAS @radix-ui/react-dropdown-menu. Good. I can use Radix primitives or build a custom one.
// I will build a custom accessible simple dropdown to avoid "component not found" errors if I haven't created "@/components/ui/..." yet.
// Actually, I have not created "@/components/ui/dropdown-menu". I should implement a simple version or just a standard UI part here.

const UserDropdown = ({ user, logout }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
            >
                <img
                    src={user.photo}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full border border-gray-200"
                />
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="px-4 py-2 border-b border-gray-100 md:hidden">
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                        Profile
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary">
                        Settings
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
};

const Navbar = ({ toggleSidebar, isMobile }) => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 left-0 z-30 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                    <Menu className="h-6 w-6" />
                </button>
                {isMobile && (
                    <span className="font-bold text-lg tracking-tight text-gray-900">SKP System</span>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>
                <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>
                <UserDropdown user={user} logout={logout} />
            </div>
        </header>
    );
};

export default Navbar;
