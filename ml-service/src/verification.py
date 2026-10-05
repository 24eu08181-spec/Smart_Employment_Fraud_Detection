import re
from urllib.parse import urlparse


def verify_company_context(company_name='', company_website='', recruiter_email='', job_source_url=''):
    checks = {
        'company_name_supplied': bool(company_name and company_name.strip()),
        'company_website_supplied': bool(company_website and company_website.strip()),
        'recruiter_email_supplied': bool(recruiter_email and recruiter_email.strip()),
        'job_source_url_supplied': bool(job_source_url and job_source_url.strip()),
    }

    company_domain = ''
    if company_website:
        parsed = urlparse(company_website)
        company_domain = parsed.netloc.lower().replace('www.', '') if parsed.netloc else ''
        checks['company_domain'] = company_domain

    email_domain = ''
    if recruiter_email:
        email_domain = recruiter_email.split('@')[-1].lower() if '@' in recruiter_email else ''
        checks['recruiter_email_domain'] = email_domain

    https_ok = bool(company_website and company_website.lower().startswith('https://'))
    free_email = bool(recruiter_email and re.search(r'@(gmail|yahoo|hotmail|outlook|icloud)\.com', recruiter_email.lower()))

    if company_website and https_ok and company_name and (not free_email or not recruiter_email):
        status = 'Verified'
    elif company_website or recruiter_email or job_source_url:
        status = 'Partial'
    else:
        status = 'Not Verified'

    if company_website and recruiter_email and company_domain and email_domain and company_domain != email_domain and not email_domain.endswith(company_domain):
        status = 'Partial'

    return {
        'verification_status': status,
        'company_name_supplied': checks['company_name_supplied'],
        'company_website_supplied': checks['company_website_supplied'],
        'recruiter_email_supplied': checks['recruiter_email_supplied'],
        'job_source_url_supplied': checks['job_source_url_supplied'],
        'https_available': https_ok,
        'free_email_provider': free_email,
        'company_domain': company_domain,
        'email_domain': email_domain,
        'source_verified': bool(job_source_url and job_source_url.lower().startswith('http')),
    }
