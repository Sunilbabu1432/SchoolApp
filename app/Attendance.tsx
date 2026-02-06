import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    Modal,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

type Student = {
    Id: string;
    Name: string;
    Roll_No__c?: string;
    Current_Class__c?: string;
    Section__c?: string;
    attendance: 'Present' | 'Absent';
};

export default function AttendanceScreen() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const isToday = useMemo(() => {
        const d = new Date(date);
        const today = new Date();
        return (
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        );
    }, [date]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [showClassPicker, setShowClassPicker] = useState(false);
    const [showSectionPicker, setShowSectionPicker] = useState(false);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Present' | 'Absent'>('All');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [teacherName, setTeacherName] = useState<string | null>(null);
    const [takenByName, setTakenByName] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);

    const classOptions = ['Nursery', 'LKG', 'UKG', 'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5', 'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10'];
    const sectionOptions = ['A', 'B', 'C', 'D'];

    useEffect(() => {
        const loadTeacher = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setTeacherId(user.id);
                setTeacherName(user.name || user.displayName || null);
            }
        };
        loadTeacher();
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            const clsTrim = selectedClass.trim();
            if (!clsTrim) {
                setStudents([]);
                setError(null);
                setHasSubmitted(false);
                setIsUpdating(false);
                setTakenByName(null);
                return;
            }

            // 1. Try to load from cache first for immediate UI
            const cacheKey = `attendance_students_${clsTrim}_${selectedSection.trim()}`;
            try {
                const cachedData = await AsyncStorage.getItem(cacheKey);
                if (cachedData && students.length === 0) {
                    setStudents(JSON.parse(cachedData));
                }
            } catch (e) {
                console.log('Cache load failed', e);
            }

            setLoading(true);
            setError(null);
            setTakenByName(null);

            try {
                const response = await api.get('/attendance/students', {
                    params: {
                        classValue: clsTrim,
                        sectionValue: selectedSection.trim(),
                        date: date.toISOString(),
                    }
                });

                const { students: studentList, session } = response.data;

                if (session) {
                    setHasSubmitted(true);
                    setTakenByName(session.takenBy);
                } else {
                    setHasSubmitted(false);
                }

                const withAttendance = studentList.map((s: any) => ({
                    ...s,
                    attendance: s.Attendance_Status__c || 'Present'
                }));

                setStudents(withAttendance);
                setIsUpdating(false);

                // 2. Clear cache and save fresh data
                await AsyncStorage.setItem(cacheKey, JSON.stringify(withAttendance));

            } catch (err: any) {
                console.error('[FETCH ERROR]', err);
                setError(err.response?.data?.error || 'Could not load students');
                // If offline and error, students will still be showing from cache if available
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedClass, selectedSection, date]);

    const stats = useMemo(() => {
        const presentCount = students.filter((s) => s.attendance === 'Present').length;
        return {
            total: students.length,
            present: presentCount,
            absent: students.length - presentCount,
        };
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (filterStatus === 'All') return students;
        return students.filter((s) => s.attendance === filterStatus);
    }, [students, filterStatus]);

    const toggle = (id: string) => {
        if (!isToday) {
            setShowReadOnlyModal(true);
            return;
        }

        setStudents((prev) =>
            prev.map((s) =>
                s.Id === id
                    ? { ...s, attendance: s.attendance === 'Present' ? 'Absent' : 'Present' }
                    : s
            )
        );
    };

    const submitAttendance = async () => {
        if (!selectedClass) return Alert.alert('Error', 'Please select a class');
        setSubmitting(true);
        setLoading(true);

        try {
            const payload = {
                date: date.toISOString(),
                takenBy: teacherId,
                classValue: selectedClass,
                sectionValue: selectedSection,
                attendances: students.map((s) => ({
                    studentId: s.Id,
                    status: s.attendance,
                    rollNumber: s.Roll_No__c,
                })),
            };

            await api.post('/attendance/save', payload);

            setHasSubmitted(true);
            setIsUpdating(false);
        } catch (err: any) {
            console.error('[SUBMIT ERROR]', err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to save attendance');
        } finally {
            setLoading(false);
            setSubmitting(false);
        }
    };

    const canSubmit = students.length > 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Daily Attendance</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.filtersContainer}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Class</Text>
                        <TouchableOpacity
                            style={styles.pickerWrapper}
                            onPress={() => setShowClassPicker(true)}
                        >
                            <Text style={styles.pickerText}>{selectedClass || 'Select Class'}</Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Section</Text>
                        <TouchableOpacity
                            style={styles.pickerWrapper}
                            onPress={() => setShowSectionPicker(true)}
                        >
                            <Text style={styles.pickerText}>{selectedSection || 'Select Sec'}</Text>
                            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                    <Ionicons name="calendar-outline" size={20} color="#6366f1" />
                    <Text style={styles.dateText}>{date.toDateString()}</Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, sel) => {
                        setShowDatePicker(false);
                        if (sel) {
                            setStudents([]);
                            setHasSubmitted(false);
                            setIsUpdating(false);
                            setLoading(true);
                            setDate(sel);
                        }
                    }}
                />
            )}

            {/* Class Picker Modal */}
            <Modal visible={showClassPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose a Class</Text>
                            <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {classOptions.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.modalItem, selectedClass === item && styles.modalItemSelected]}
                                    onPress={() => {
                                        setStudents([]);
                                        setHasSubmitted(false);
                                        setIsUpdating(false);
                                        setLoading(true);
                                        setSelectedClass(item);
                                        setShowClassPicker(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, selectedClass === item && styles.modalItemTextSelected]}>
                                        {item}
                                    </Text>
                                    {selectedClass === item && <Ionicons name="checkmark-circle" size={20} color="#6366f1" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Section Picker Modal */}
            <Modal visible={showSectionPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Section</Text>
                            <TouchableOpacity onPress={() => setShowSectionPicker(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.gridContainer}>
                            {['', ...sectionOptions].map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.gridItem, selectedSection === item && styles.gridItemSelected]}
                                    onPress={() => {
                                        setStudents([]);
                                        setHasSubmitted(false);
                                        setIsUpdating(false);
                                        setLoading(true);
                                        setSelectedSection(item);
                                        setShowSectionPicker(false);
                                    }}
                                >
                                    <Text style={[styles.gridItemText, selectedSection === item && styles.gridItemTextSelected]}>
                                        {item || 'None'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Read Only Modal */}
            <Modal visible={showReadOnlyModal} transparent animationType="fade">
                <View style={styles.alertOverlay}>
                    <View style={styles.alertCard}>
                        <View style={styles.alertIconBox}>
                            <Ionicons name="lock-closed" size={32} color="#6366f1" />
                        </View>
                        <Text style={styles.alertTitle}>Read Only</Text>
                        <Text style={styles.alertDesc}>You cannot edit attendance for past dates.</Text>
                        <TouchableOpacity
                            style={styles.alertButton}
                            onPress={() => setShowReadOnlyModal(false)}
                        >
                            <Text style={styles.alertButtonText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.content}>
                {hasSubmitted && !isUpdating ? (
                    <View style={styles.successView}>
                        <View style={styles.successCard}>
                            <View style={styles.successIconBox}>
                                <Ionicons name="checkmark-circle" size={50} color="#10b981" />
                            </View>
                            <Text style={styles.successTitle}>Attendance Submitted</Text>
                            <Text style={styles.successDesc}>
                                Attendance for {selectedClass} - {selectedSection || 'All Sections'} has been recorded.
                            </Text>
                            {(takenByName || teacherName) && (
                                <View style={styles.submittedByContainer}>
                                    <Text style={styles.submittedByLabel}>Attendance submitted by</Text>
                                    <Text style={styles.submittedByName}>{takenByName || teacherName}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setIsUpdating(true)}
                            >
                                <Text style={styles.actionButtonText}>
                                    {isToday ? 'Update Attendance' : 'View Records'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <TouchableOpacity
                                style={[styles.statItem, filterStatus === 'All' && styles.statActive]}
                                onPress={() => setFilterStatus('All')}
                            >
                                <Text style={styles.statVal}>{stats.total}</Text>
                                <Text style={styles.statLabel}>Total</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statItem, filterStatus === 'Present' && styles.statActive]}
                                onPress={() => setFilterStatus('Present')}
                            >
                                <Text style={[styles.statVal, { color: '#10b981' }]}>{stats.present}</Text>
                                <Text style={styles.statLabel}>Present</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statItem, filterStatus === 'Absent' && styles.statActive]}
                                onPress={() => setFilterStatus('Absent')}
                            >
                                <Text style={[styles.statVal, { color: '#ef4444' }]}>{stats.absent}</Text>
                                <Text style={styles.statLabel}>Absent</Text>
                            </TouchableOpacity>
                        </View>

                        {isUpdating && (
                            <TouchableOpacity onPress={() => setIsUpdating(false)} style={styles.underStatsCloseBtn}>
                                <Text style={styles.closeBtnText}>Close</Text>
                                <Ionicons name="close-circle" size={24} color="#ef4444" />
                            </TouchableOpacity>
                        )}

                        {loading && filteredStudents.length === 0 ? (
                            <View style={styles.premiumLoadingWrapper}>
                                <View style={styles.loadingPulseOuter}>
                                    <View style={styles.loadingPulseInner}>
                                        <ActivityIndicator size="large" color="#6366f1" />
                                    </View>
                                </View>
                                <Text style={styles.premiumLoadingText}>
                                    {submitting ? 'Submitting Attendance...' : 'Fetching Student List...'}
                                </Text>
                                <Text style={styles.loadingSubtext}>This will take just a second</Text>
                            </View>
                        ) : error && filteredStudents.length === 0 ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
                            <View style={{ flex: 1 }}>
                                {loading && filteredStudents.length > 0 && (
                                    <View style={styles.updatingIndicator}>
                                        <ActivityIndicator size="small" color="#6366f1" />
                                        <Text style={styles.updatingText}>Updating list...</Text>
                                    </View>
                                )}
                                <FlatList
                                    data={filteredStudents}
                                    keyExtractor={(item) => item.Id}
                                    contentContainerStyle={styles.listContainer}
                                    ListEmptyComponent={
                                        <View style={styles.emptyBox}>
                                            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                                            <Text style={styles.emptyText}>
                                                {selectedClass ? 'No students found' : 'Select a class to see students'}
                                            </Text>
                                        </View>
                                    }
                                    renderItem={({ item }) => {
                                        const isPresent = item.attendance === 'Present';
                                        return (
                                            <TouchableOpacity
                                                activeOpacity={0.7}
                                                onPress={() => toggle(item.Id)}
                                                style={[styles.studentCard, isPresent ? styles.presentCard : styles.absentCard]}
                                            >
                                                <View style={styles.studentInfo}>
                                                    <Text style={styles.studentName}>{item.Name}</Text>
                                                    <Text style={styles.studentDetails}>Roll: {item.Roll_No__c || 'N/A'}</Text>
                                                </View>
                                                <View style={[styles.statusBadge, isPresent ? styles.presentBadge : styles.absentBadge]}>
                                                    <Ionicons name={isPresent ? 'checkmark-circle' : 'close-circle'} size={18} color={isPresent ? '#10b981' : '#ef4444'} />
                                                    <Text style={[styles.statusText, isPresent ? styles.presentText : styles.absentText]}>
                                                        {isPresent ? 'Present' : 'Absent'}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}
            </View>

            {canSubmit && isToday && (!hasSubmitted || isUpdating) && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.submitBtn, (!canSubmit || loading) && { opacity: 0.6 }]}
                        onPress={submitAttendance}
                        disabled={!canSubmit || loading}
                    >
                        {submitting ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <ActivityIndicator color="#fff" />
                                <Text style={styles.submitBtnText}>Submitting Attendance...</Text>
                            </View>
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Attendance</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Class Picker Modal */}
            <Modal visible={showClassPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Choose a Class</Text>
                            <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalList}>
                            {classOptions.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.modalItem, selectedClass === item && styles.modalItemSelected]}
                                    onPress={() => {
                                        setStudents([]);
                                        setHasSubmitted(false);
                                        setIsUpdating(false);
                                        setLoading(true);
                                        setSelectedClass(item);
                                        setShowClassPicker(false);
                                    }}
                                >
                                    <Text style={[styles.modalItemText, selectedClass === item && styles.modalItemTextSelected]}>
                                        {item}
                                    </Text>
                                    {selectedClass === item && <Ionicons name="checkmark-circle" size={20} color="#6366f1" />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Section Picker Modal */}
            <Modal visible={showSectionPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Section</Text>
                            <TouchableOpacity onPress={() => setShowSectionPicker(false)}>
                                <Ionicons name="close-circle" size={28} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.gridContainer}>
                            {['', ...sectionOptions].map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.gridItem, selectedSection === item && styles.gridItemSelected]}
                                    onPress={() => {
                                        setStudents([]);
                                        setHasSubmitted(false);
                                        setIsUpdating(false);
                                        setLoading(true);
                                        setSelectedSection(item);
                                        setShowSectionPicker(false);
                                    }}
                                >
                                    <Text style={[styles.gridItemText, selectedSection === item && styles.gridItemTextSelected]}>
                                        {item || 'None'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
        paddingBottom: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
    },
    updateActionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
    },
    updateTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    closeActionBtn: { padding: 4 },
    underStatsCloseBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginRight: 0,
        marginBottom: 15,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fee2e2',
        gap: 6,
        elevation: 2,
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ef4444',
    },
    premiumLoadingWrapper: {
        marginTop: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingPulseOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eef2ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    loadingPulseInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#6366f1',
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    premiumLoadingText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#6366f1',
        marginTop: 10,
    },

    // Custom Alert Styles
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    alertCard: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 28,
        padding: 30,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#6366f1',
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    alertIconBox: {
        width: 64,
        height: 64,
        backgroundColor: '#eef2ff',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    alertTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 8,
    },
    alertDesc: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
    },
    alertButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    alertButtonText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#fff', textAlign: 'center' },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    closeHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    filtersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 15,
    },
    filterGroup: { flex: 1 },
    filterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 4 },
    pickerWrapper: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        height: 52,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    pickerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 10,
    },
    dateText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1e293b' },

    loadingWrapper: {
        marginTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingCard: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#6366f1',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        width: '80%',
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 15,
    },
    loadingSubtext: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },

    content: { flex: 1, padding: 20 },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    statActive: { borderColor: '#6366f1', backgroundColor: '#eef2ff' },
    statVal: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },

    listContainer: { paddingBottom: 120 },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
    },
    presentCard: { borderColor: '#bbf7d0' },
    absentCard: { borderColor: '#fecaca' },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
    studentDetails: { fontSize: 13, color: '#64748b', marginTop: 2 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    presentBadge: { backgroundColor: '#f0fdf4' },
    absentBadge: { backgroundColor: '#fef2f2' },
    statusText: { fontSize: 12, fontWeight: '700' },
    presentText: { color: '#10b981' },
    absentText: { color: '#ef4444' },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    updatingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eef2ff',
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    updatingText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6366f1',
    },
    emptyText: { marginTop: 15, fontSize: 16, color: '#94a3b8', fontWeight: '600' },
    errorBox: { backgroundColor: '#fef2f2', padding: 15, borderRadius: 12 },
    errorText: { color: '#ef4444', textAlign: 'center' },

    successView: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
    successCard: {
        backgroundColor: '#fff',
        padding: 35,
        borderRadius: 36,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#6366f1',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
    },
    successIconBox: {
        width: 80,
        height: 80,
        backgroundColor: '#f0fdf4',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    successTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 10 },
    successDesc: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
    submittedByContainer: {
        backgroundColor: '#eef2ff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e7ff',
    },
    submittedByLabel: {
        fontSize: 12,
        color: '#6366f1',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    submittedByName: {
        fontSize: 18,
        color: '#1e293b',
        fontWeight: '800',
    },
    actionButton: {
        backgroundColor: '#6366f1',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: Dimensions.get('window').height * 0.7,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
    modalList: { paddingHorizontal: 16 },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 8,
    },
    modalItemSelected: { backgroundColor: '#f5f7ff' },
    modalItemText: { fontSize: 16, color: '#475569', fontWeight: '600' },
    modalItemTextSelected: { color: '#6366f1', fontWeight: '700' },

    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 12,
    },
    gridItem: {
        width: (Dimensions.get('window').width - 64) / 3,
        height: 60,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    gridItemSelected: {
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
    },
    gridItemText: { fontSize: 16, color: '#475569', fontWeight: '700' },
    gridItemTextSelected: { color: '#fff' },

    footer: {
        position: 'absolute',
        bottom: 30, // Moved up
        left: 20,
        right: 20,
        padding: 0,
        backgroundColor: 'transparent',
    },
    submitBtn: {
        backgroundColor: '#6366f1',
        height: 60,
        borderRadius: 24, // Rounder
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#6366f1',
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
