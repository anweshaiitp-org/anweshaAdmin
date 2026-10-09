import { 
  FiShield,
  FiUser, 
  FiCalendar, 
  FiHome, 
  FiCreditCard, 
  FiAward, 
  FiRadio,
  FiClipboard,
  FiMaximize,
  FiZap,
  FiActivity,
  FiUserPlus
} from "react-icons/fi";

export const sidebarItems = [
  { name: "Dashboard", icon: FiShield, path: "/admin" }, 
  { name: "User", icon: FiUser, path: "/admin/users" },
  { name: "Manual Entry", icon: FiUserPlus, path: "/admin/manual-entry" },
  { name: "Events", icon: FiCalendar, path: "/admin/events" },
  { name: "Registration", icon: FiClipboard, path: "/admin/registration" },
  { name: "Accommodation", icon: FiHome, path: "/admin/accommodation" },
  { name: "Payments", icon: FiCreditCard, path: "/admin/payment" },
  { name: "Campus Ambassador", icon: FiAward, path: "/admin/ca" },
  { name: "Broadcast", icon: FiRadio, path: "/admin/broadcast/list" },
  { name: "Scanner", icon: FiMaximize, path: "/admin/scanner" },
  { name: "System Logs", icon: FiActivity, path: "/admin/logs" },
];
