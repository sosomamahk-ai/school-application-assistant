import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { Save, Plus, Trash2 } from 'lucide-react';

interface ProfileData {
  // 基本信息
  chineseLastName?: string;
  chineseFirstName?: string;
  englishLastName?: string;
  englishFirstName?: string;
  preferredName?: string;
  race?: string;
  gender?: string;
  nationality?: string;
  birthday?: string;
  passportNumber?: string;
  hkIdNumber?: string;
  visaStatus?: string;
  
  // 语言情况
  nativeLanguage?: string;
  secondLanguage?: string;
  languageProficiency?: Array<{ language: string; level: string }>;
  standardizedTests?: Array<{ testName: string; score: string; date: string }>;
  
  // 教育经历
  education?: Array<{
    schoolName: string;
    admissionDate: string;
    withdrawalDate: string;
    startGrade: string;
    endGrade: string;
    gradeSystem: string;
  }>;
  
  // 联系方式
  studentPhone?: string;
  studentEmail?: string;
  parentPhone?: string;
  parentEmail?: string;
  homeAddress?: string;
  
  // 父母信息
  parents?: Array<{
    relationship: string;
    name: string;
    passportNumber: string;
    idNumber: string;
    visaStatus: string;
    company: string;
    position: string;
    workPhone: string;
    workEmail: string;
    workAddress: string;
    education: string;
  }>;
  
  // 其他情况
  specialEducationNeeds?: string;
  healthConditions?: string;
  gradeRetentionOrSkip?: string;
  
  // 活动情况
  activities?: Array<{
    activityName: string;
    description: string;
    startDate: string;
    endDate: string;
  }>;
  
  awards?: Array<{
    awardName: string;
    organization: string;
    date: string;
    description: string;
  }>;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [profile, setProfile] = useState<ProfileData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Merge existing profile data with our structure
        setProfile({
          ...data.profile,
          ...(data.profile.additionalData as ProfileData || {})
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save all data in additionalData field
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: `${profile.chineseLastName || ''}${profile.chineseFirstName || ''}`.trim() || 
                   `${profile.englishFirstName || ''} ${profile.englishLastName || ''}`.trim(),
          phone: profile.studentPhone,
          birthday: profile.birthday,
          nationality: profile.nationality,
          additionalData: profile
        })
      });

      if (response.ok) {
        alert('个人资料保存成功！');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfile({ ...profile, [field]: value });
  };

  const addArrayItem = (arrayName: keyof ProfileData, defaultItem: any) => {
    const currentArray = (profile[arrayName] as any[]) || [];
    setProfile({
      ...profile,
      [arrayName]: [...currentArray, defaultItem]
    });
  };

  const removeArrayItem = (arrayName: keyof ProfileData, index: number) => {
    const currentArray = [...((profile[arrayName] as any[]) || [])];
    currentArray.splice(index, 1);
    setProfile({ ...profile, [arrayName]: currentArray });
  };

  const updateArrayItem = (arrayName: keyof ProfileData, index: number, field: string, value: any) => {
    const currentArray = [...((profile[arrayName] as any[]) || [])];
    currentArray[index] = { ...currentArray[index], [field]: value };
    setProfile({ ...profile, [arrayName]: currentArray });
  };

  const tabs = [
    { id: 'basic', label: '基本信息' },
    { id: 'language', label: '语言情况' },
    { id: 'education', label: '教育经历' },
    { id: 'contact', label: '联系方式' },
    { id: 'parents', label: '父母信息' },
    { id: 'other', label: '其他情况' },
    { id: 'activities', label: '活动与获奖' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>完善个人资料 - 学校申请助手</title>
      </Head>

      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">完善个人资料</h1>
              <p className="text-gray-600 mt-2">填写详细信息以便更好地使用申请助手</p>
            </div>
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? '保存中...' : '保存资料'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* 基本信息 */}
            {activeTab === 'basic' && (
              <BasicInfoTab profile={profile} updateField={updateField} />
            )}

            {/* 语言情况 */}
            {activeTab === 'language' && (
              <LanguageTab 
                profile={profile} 
                updateField={updateField}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                updateArrayItem={updateArrayItem}
              />
            )}

            {/* 教育经历 */}
            {activeTab === 'education' && (
              <EducationTab
                profile={profile}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                updateArrayItem={updateArrayItem}
              />
            )}

            {/* 联系方式 */}
            {activeTab === 'contact' && (
              <ContactTab profile={profile} updateField={updateField} />
            )}

            {/* 父母信息 */}
            {activeTab === 'parents' && (
              <ParentsTab
                profile={profile}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                updateArrayItem={updateArrayItem}
              />
            )}

            {/* 其他情况 */}
            {activeTab === 'other' && (
              <OtherTab profile={profile} updateField={updateField} />
            )}

            {/* 活动与获奖 */}
            {activeTab === 'activities' && (
              <ActivitiesTab
                profile={profile}
                addArrayItem={addArrayItem}
                removeArrayItem={removeArrayItem}
                updateArrayItem={updateArrayItem}
              />
            )}
          </div>

          {/* Save Button at Bottom */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? '保存中...' : '保存资料'}</span>
            </button>
          </div>
        </div>
      </Layout>
    </>
  );
}

// Tab Components
function BasicInfoTab({ profile, updateField }: any) {
  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">基本信息</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">中文姓</label>
          <input
            type="text"
            value={profile.chineseLastName || ''}
            onChange={(e) => updateField('chineseLastName', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">中文名</label>
          <input
            type="text"
            value={profile.chineseFirstName || ''}
            onChange={(e) => updateField('chineseFirstName', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">英文姓 (Last Name)</label>
          <input
            type="text"
            value={profile.englishLastName || ''}
            onChange={(e) => updateField('englishLastName', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">英文名 (First Name)</label>
          <input
            type="text"
            value={profile.englishFirstName || ''}
            onChange={(e) => updateField('englishFirstName', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">常用名 (Preferred Name)</label>
          <input
            type="text"
            value={profile.preferredName || ''}
            onChange={(e) => updateField('preferredName', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">种族 (Race)</label>
          <select
            value={profile.race || ''}
            onChange={(e) => updateField('race', e.target.value)}
            className="input-field"
          >
            <option value="">请选择</option>
            <option value="亚裔">亚裔</option>
            <option value="白人">白人</option>
            <option value="非裔">非裔</option>
            <option value="拉丁裔">拉丁裔</option>
            <option value="混血">混血</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
          <select
            value={profile.gender || ''}
            onChange={(e) => updateField('gender', e.target.value)}
            className="input-field"
          >
            <option value="">请选择</option>
            <option value="男">男</option>
            <option value="女">女</option>
            <option value="其他">其他</option>
            <option value="不愿透露">不愿透露</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">国籍</label>
          <input
            type="text"
            value={profile.nationality || ''}
            onChange={(e) => updateField('nationality', e.target.value)}
            className="input-field"
            placeholder="例如：中国"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">出生日期</label>
          <input
            type="date"
            value={profile.birthday || ''}
            onChange={(e) => updateField('birthday', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">护照号码</label>
          <input
            type="text"
            value={profile.passportNumber || ''}
            onChange={(e) => updateField('passportNumber', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">香港身份证号码</label>
          <input
            type="text"
            value={profile.hkIdNumber || ''}
            onChange={(e) => updateField('hkIdNumber', e.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">签证情况</label>
          <select
            value={profile.visaStatus || ''}
            onChange={(e) => updateField('visaStatus', e.target.value)}
            className="input-field"
          >
            <option value="">请选择</option>
            <option value="受养人">受养人</option>
            <option value="永久居民">永久居民</option>
            <option value="外籍学生签证">外籍学生签证</option>
            <option value="待办中">待办中</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function LanguageTab({ profile, updateField, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">语言能力</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">母语</label>
            <input
              type="text"
              value={profile.nativeLanguage || ''}
              onChange={(e) => updateField('nativeLanguage', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">第二外语</label>
            <input
              type="text"
              value={profile.secondLanguage || ''}
              onChange={(e) => updateField('secondLanguage', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* 语言流利程度 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">语言流利程度</h3>
          <button
            onClick={() => addArrayItem('languageProficiency', { language: '', level: '' })}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>添加语言</span>
          </button>
        </div>
        <div className="space-y-4">
          {(profile.languageProficiency || []).map((lang: any, index: number) => (
            <div key={index} className="flex gap-4 items-start border-b border-gray-200 pb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateArrayItem('languageProficiency', index, 'language', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">流利程度</label>
                <select
                  value={lang.level}
                  onChange={(e) => updateArrayItem('languageProficiency', index, 'level', e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择</option>
                  <option value="母语">母语</option>
                  <option value="流利">流利</option>
                  <option value="良好">良好</option>
                  <option value="基础">基础</option>
                </select>
              </div>
              <button
                onClick={() => removeArrayItem('languageProficiency', index)}
                className="text-red-600 hover:text-red-700 mt-7"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 标化考试成绩 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">标化考试成绩</h3>
          <button
            onClick={() => addArrayItem('standardizedTests', { testName: '', score: '', date: '' })}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>添加考试</span>
          </button>
        </div>
        <div className="space-y-4">
          {(profile.standardizedTests || []).map((test: any, index: number) => (
            <div key={index} className="grid md:grid-cols-3 gap-4 border-b border-gray-200 pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">考试名称</label>
                <select
                  value={test.testName}
                  onChange={(e) => updateArrayItem('standardizedTests', index, 'testName', e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择</option>
                  <option value="TOEFL">TOEFL</option>
                  <option value="IELTS">IELTS</option>
                  <option value="小托福">小托福</option>
                  <option value="FCE">FCE</option>
                  <option value="KET">KET</option>
                  <option value="PET">PET</option>
                  <option value="Raz">Raz</option>
                  <option value="MAP">MAP</option>
                  <option value="CAT4">CAT4</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">成绩</label>
                <input
                  type="text"
                  value={test.score}
                  onChange={(e) => updateArrayItem('standardizedTests', index, 'score', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">考试日期</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={test.date}
                    onChange={(e) => updateArrayItem('standardizedTests', index, 'date', e.target.value)}
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => removeArrayItem('standardizedTests', index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Continue with other tab components...
// (Due to length, I'll create these in separate responses or you can tell me to continue)

function EducationTab({ profile, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">教育经历</h2>
        <button
          onClick={() => addArrayItem('education', {
            schoolName: '',
            admissionDate: '',
            withdrawalDate: '',
            startGrade: '',
            endGrade: '',
            gradeSystem: 'Grade'
          })}
          className="btn-secondary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>添加教育经历</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {(profile.education || []).map((edu: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-900">学校 {index + 1}</h3>
              <button
                onClick={() => removeArrayItem('education', index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">学校名称</label>
                <input
                  type="text"
                  value={edu.schoolName}
                  onChange={(e) => updateArrayItem('education', index, 'schoolName', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入学时间</label>
                <input
                  type="date"
                  value={edu.admissionDate}
                  onChange={(e) => updateArrayItem('education', index, 'admissionDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退学时间</label>
                <input
                  type="date"
                  value={edu.withdrawalDate}
                  onChange={(e) => updateArrayItem('education', index, 'withdrawalDate', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">起始年级</label>
                <input
                  type="text"
                  value={edu.startGrade}
                  onChange={(e) => updateArrayItem('education', index, 'startGrade', e.target.value)}
                  className="input-field"
                  placeholder="例如：Grade 7 或 Year 7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">结束年级</label>
                <input
                  type="text"
                  value={edu.endGrade}
                  onChange={(e) => updateArrayItem('education', index, 'endGrade', e.target.value)}
                  className="input-field"
                  placeholder="例如：Grade 9 或 Year 9"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">年级制度</label>
                <select
                  value={edu.gradeSystem}
                  onChange={(e) => updateArrayItem('education', index, 'gradeSystem', e.target.value)}
                  className="input-field"
                >
                  <option value="Grade">Grade (12年制)</option>
                  <option value="Year">Year (13年制)</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactTab({ profile, updateField }: any) {
  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">联系方式</h2>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">学生联系方式</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input
              type="tel"
              value={profile.studentPhone || ''}
              onChange={(e) => updateField('studentPhone', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.studentEmail || ''}
              onChange={(e) => updateField('studentEmail', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">家长联系方式</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
            <input
              type="tel"
              value={profile.parentPhone || ''}
              onChange={(e) => updateField('parentPhone', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={profile.parentEmail || ''}
              onChange={(e) => updateField('parentEmail', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">家庭地址</h3>
        <textarea
          value={profile.homeAddress || ''}
          onChange={(e) => updateField('homeAddress', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="请输入完整的家庭地址"
        />
      </div>
    </div>
  );
}

function ParentsTab({ profile, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">父母信息</h2>
        <button
          onClick={() => addArrayItem('parents', {
            relationship: '父亲',
            name: '',
            passportNumber: '',
            idNumber: '',
            visaStatus: '',
            company: '',
            position: '',
            workPhone: '',
            workEmail: '',
            workAddress: '',
            education: ''
          })}
          className="btn-secondary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>添加父母信息</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {(profile.parents || []).map((parent: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-gray-900">{parent.relationship || `家长 ${index + 1}`}</h3>
              <button
                onClick={() => removeArrayItem('parents', index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关系</label>
                <select
                  value={parent.relationship}
                  onChange={(e) => updateArrayItem('parents', index, 'relationship', e.target.value)}
                  className="input-field"
                >
                  <option value="父亲">父亲</option>
                  <option value="母亲">母亲</option>
                  <option value="监护人">监护人</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={parent.name}
                  onChange={(e) => updateArrayItem('parents', index, 'name', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">护照号码</label>
                <input
                  type="text"
                  value={parent.passportNumber}
                  onChange={(e) => updateArrayItem('parents', index, 'passportNumber', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">身份证号码</label>
                <input
                  type="text"
                  value={parent.idNumber}
                  onChange={(e) => updateArrayItem('parents', index, 'idNumber', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签证情况</label>
                <select
                  value={parent.visaStatus}
                  onChange={(e) => updateArrayItem('parents', index, 'visaStatus', e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择</option>
                  <option value="受养人">受养人</option>
                  <option value="永久居民">永久居民</option>
                  <option value="工作签证">工作签证</option>
                  <option value="待办中">待办中</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学历</label>
                <select
                  value={parent.education}
                  onChange={(e) => updateArrayItem('parents', index, 'education', e.target.value)}
                  className="input-field"
                >
                  <option value="">请选择</option>
                  <option value="高中">高中</option>
                  <option value="本科">本科</option>
                  <option value="研究生">研究生</option>
                  <option value="博士">博士</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">工作单位名称</label>
                <input
                  type="text"
                  value={parent.company}
                  onChange={(e) => updateArrayItem('parents', index, 'company', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">职位</label>
                <input
                  type="text"
                  value={parent.position}
                  onChange={(e) => updateArrayItem('parents', index, 'position', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工作电话</label>
                <input
                  type="tel"
                  value={parent.workPhone}
                  onChange={(e) => updateArrayItem('parents', index, 'workPhone', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">工作邮箱</label>
                <input
                  type="email"
                  value={parent.workEmail}
                  onChange={(e) => updateArrayItem('parents', index, 'workEmail', e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">工作单位地址</label>
                <textarea
                  value={parent.workAddress}
                  onChange={(e) => updateArrayItem('parents', index, 'workAddress', e.target.value)}
                  rows={2}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OtherTab({ profile, updateField }: any) {
  return (
    <div className="card space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">其他情况</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">特殊教育需求</label>
        <textarea
          value={profile.specialEducationNeeds || ''}
          onChange={(e) => updateField('specialEducationNeeds', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="如有特殊教育需求，请详细说明"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">健康情况</label>
        <textarea
          value={profile.healthConditions || ''}
          onChange={(e) => updateField('healthConditions', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="如有需要说明的健康情况，请详细描述"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">是否曾经留级或跳级</label>
        <textarea
          value={profile.gradeRetentionOrSkip || ''}
          onChange={(e) => updateField('gradeRetentionOrSkip', e.target.value)}
          rows={2}
          className="input-field"
          placeholder="如有留级或跳级经历，请说明具体情况"
        />
      </div>
    </div>
  );
}

function ActivitiesTab({ profile, addArrayItem, removeArrayItem, updateArrayItem }: any) {
  return (
    <div className="space-y-6">
      {/* 活动经历 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">活动经历</h2>
          <button
            onClick={() => addArrayItem('activities', {
              activityName: '',
              description: '',
              startDate: '',
              endDate: ''
            })}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>添加活动</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {(profile.activities || []).map((activity: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-gray-900">活动 {index + 1}</h3>
                <button
                  onClick={() => removeArrayItem('activities', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
                  <input
                    type="text"
                    value={activity.activityName}
                    onChange={(e) => updateArrayItem('activities', index, 'activityName', e.target.value)}
                    className="input-field"
                    placeholder="例如：AMC数学竞赛、校足球队、BPhO物理奥赛"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                  <textarea
                    value={activity.description}
                    onChange={(e) => updateArrayItem('activities', index, 'description', e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="详细描述您在活动中的角色和贡献"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={activity.startDate}
                    onChange={(e) => updateArrayItem('activities', index, 'startDate', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={activity.endDate}
                    onChange={(e) => updateArrayItem('activities', index, 'endDate', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 获奖记录 */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">获奖记录</h2>
          <button
            onClick={() => addArrayItem('awards', {
              awardName: '',
              organization: '',
              date: '',
              description: ''
            })}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>添加获奖</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {(profile.awards || []).map((award: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-gray-900">获奖 {index + 1}</h3>
                <button
                  onClick={() => removeArrayItem('awards', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">奖项名称</label>
                  <input
                    type="text"
                    value={award.awardName}
                    onChange={(e) => updateArrayItem('awards', index, 'awardName', e.target.value)}
                    className="input-field"
                    placeholder="例如：AMC10 Distinguished Honor Roll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">颁奖机构</label>
                  <input
                    type="text"
                    value={award.organization}
                    onChange={(e) => updateArrayItem('awards', index, 'organization', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">获奖日期</label>
                  <input
                    type="date"
                    value={award.date}
                    onChange={(e) => updateArrayItem('awards', index, 'date', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">奖项说明</label>
                  <textarea
                    value={award.description}
                    onChange={(e) => updateArrayItem('awards', index, 'description', e.target.value)}
                    rows={2}
                    className="input-field"
                    placeholder="简要说明奖项的意义和获奖原因"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
