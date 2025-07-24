  label: string;
  icon: string;
}

interface FloatingMenuProps {
  navItems: NavItem[];
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ navItems }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={toggleMenu}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-brand-pink-500 text-white rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300"
        aria-label="Abrir menu de navegação"
      >
        <Icon icon="wand" className="w-8 h-8" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center backdrop-blur-sm"
          onClick={closeMenu}
        >
          <div 
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-serif font-bold text-gray-800 dark:text-white mb-6 text-center">Navegação Rápida</h3>
            <nav className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/20 rounded-xl hover:bg-brand-pink-100 dark:hover:bg-brand-pink-700/50 transition-colors duration-300 transform hover:-translate-y-1"
                >
                  <Icon icon={item.icon} className="w-8 h-8 text-brand-purple-500 mb-2" />
                  <span className="font-semibold text-sm text-center">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingMenu;