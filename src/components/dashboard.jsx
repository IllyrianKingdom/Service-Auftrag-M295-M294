import './dashboard.css';

function Dashboard() {
    return (
        <>
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <div className="header-left">
                        <h1 className="company-name">AVA GmbH</h1>
                    </div>
                    <div className="header-right">
                        <span className="user-info">Benutzer: BL Vedran Jerkovic</span>
                    </div>
                </div>

                {/* Main Dashboard Section */}
                <div className="dashboard-main">
                    <div className="dashboard-card">
                        <h2 className="dashboard-title">Dashboard</h2>
                        
                        <nav className="menu-list">
                            <a href="#auftraege" className="menu-item">Aufträge</a>
                            <a href="#disposition" className="menu-item">Disposition</a>
                            <a href="#berichte" className="menu-item">Berichte</a>
                            <a href="#einstellungen" className="menu-item">Einstellungen</a>
                            <a href="#logout" className="menu-item menu-logout">Logout</a>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Dashboard;