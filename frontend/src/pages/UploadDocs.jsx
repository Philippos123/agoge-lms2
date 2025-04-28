import DocumentUpload from '../components/DocumentUpload';
import Navbar from '../components/navbar';
import DocumentsDashboard from '../components/DocumentsDashboard';
function Docs() {
  return (
    <div className="Docs">
      <Navbar />
      <DocumentUpload />
      <DocumentsDashboard />
    </div>
  );
}

export default Docs;
