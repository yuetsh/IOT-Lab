import { useState, useEffect } from 'react';
import CompanySelect from './CompanySelect';
import CompanyWorkspace from './CompanyWorkspace';

export default function StudentApp() {
  const [company, setCompany] = useState(null); // { id, name }

  useEffect(() => {
    const id = localStorage.getItem('selectedCompanyId');
    const name = localStorage.getItem('selectedCompanyName');
    if (id && name) setCompany({ id: Number(id), name });
  }, []);

  function handleSelect(c) {
    localStorage.setItem('selectedCompanyId', c.id);
    localStorage.setItem('selectedCompanyName', c.name);
    setCompany(c);
  }

  function handleChange() {
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyName');
    setCompany(null);
  }

  if (!company) return <CompanySelect onSelect={handleSelect} />;
  return <CompanyWorkspace company={company} onChangeCompany={handleChange} />;
}
