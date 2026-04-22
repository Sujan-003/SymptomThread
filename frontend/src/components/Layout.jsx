import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="font-body-base antialiased min-h-screen flex flex-col pt-16 pb-20 md:pb-0 bg-background text-on-surface">
      {/* TopAppBar */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hidden md:flex">
        <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400 font-manrope antialiased">
            SymptomThread
          </div>
          {/* Web Navigation */}
          <nav className="hidden md:flex gap-8 items-center h-full">
            <NavLink to="/" className={({ isActive }) => `group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium text-sm h-full px-2 border-b-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-600' : 'border-transparent hover:border-indigo-500'}`}>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" data-icon="home" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>home</span>
                  <span>Home</span>
                </>
              )}
            </NavLink>
            <NavLink to="/log" className={({ isActive }) => `group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium text-sm h-full px-2 border-b-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-600' : 'border-transparent hover:border-indigo-500'}`}>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" data-icon="add_circle" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>add_circle</span>
                  <span>Log</span>
                </>
              )}
            </NavLink>
            <NavLink to="/timeline" className={({ isActive }) => `group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium text-sm h-full px-2 border-b-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-600' : 'border-transparent hover:border-indigo-500'}`}>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" data-icon="history" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>history</span>
                  <span>Timeline</span>
                </>
              )}
            </NavLink>
            <NavLink to="/graph" className={({ isActive }) => `group flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors font-medium text-sm h-full px-2 border-b-2 ${isActive ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-600' : 'border-transparent hover:border-indigo-500'}`}>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[20px]" data-icon="hub" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>hub</span>
                  <span>Insights</span>
                </>
              )}
            </NavLink>
          </nav>
          <div className="flex items-center gap-4 text-indigo-600 dark:text-indigo-400">
            <button className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-full p-2 active:scale-95 duration-200 ease-in-out">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            </button>
            <button className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-full p-2 active:scale-95 duration-200 ease-in-out">
              <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Outlet />

      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg fixed bottom-0 w-full z-50 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] flex justify-around items-center h-20 px-4 pb-safe w-full">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 active:scale-90 transition-transform duration-150 ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300'}`}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl mb-1" data-icon="home" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>home</span>
              <span className="text-[11px] font-medium font-manrope">Home</span>
            </>
          )}
        </NavLink>
        <NavLink to="/log" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 active:scale-90 transition-transform duration-150 ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300'}`}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl mb-1" data-icon="add_circle" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>add_circle</span>
              <span className="text-[11px] font-medium font-manrope">Log</span>
            </>
          )}
        </NavLink>
        <NavLink to="/timeline" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 active:scale-90 transition-transform duration-150 ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300'}`}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl mb-1" data-icon="history" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>history</span>
              <span className="text-[11px] font-medium font-manrope">Timeline</span>
            </>
          )}
        </NavLink>
        <NavLink to="/graph" className={({ isActive }) => `flex flex-col items-center justify-center px-4 py-1 active:scale-90 transition-transform duration-150 ${isActive ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl' : 'text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-300'}`}>
          {({ isActive }) => (
            <>
              <span className="material-symbols-outlined text-2xl mb-1" data-icon="hub" style={isActive ? {fontVariationSettings: "'FILL' 1"} : {}}>hub</span>
              <span className="text-[11px] font-medium font-manrope">Insights</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
