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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
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
    const [filterStatus, setFilterStatus] = useState<'All' | 'Present' | 'Absent'>('All');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [teacherId, setTeacherId] = useState<string | null>(null);
    const [takenByName, setTakenByName] = useState<string | null>(null);

    const classOptions = ['', 'Nursery', 'LKG', 'UKG', 'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5', 'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10'];
    const sectionOptions = ['', 'A', 'B', 'C'];

    useEffect(() => {
        const loadTeacher = async () => {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setTeacherId(user.id);
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
            } catch (err: any) {
                console.error('[FETCH ERROR]', err);
                setError(err.response?.data?.error || 'Could not load students');
                setStudents([]);
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
            Alert.alert('Read Only', 'You cannot edit past attendance.');
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
        if (!students.length) return;
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
            Alert.alert('Success', 'Attendance saved successfully');
        } catch (err: any) {
            console.error('[SUBMIT ERROR]', err);
            Alert.alert('Error', err.response?.data?.error || 'Failed to save attendance');
        } finally {
            setLoading(false);
        }
    };

    const canSubmit = students.length > 0 && !loading;

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
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedClass}
                                onValueChange={(v) => setSelectedClass(v)}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                {classOptions.map((c) => (
                                    <Picker.Item key={c} label={c || 'Select Class'} value={c} color={Platform.OS === 'ios' ? '#000' : '#475569'} />
                                ))}
                            </Picker>
                        </View>
                    </View>

                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Section</Text>
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={selectedSection}
                                onValueChange={(v) => setSelectedSection(v)}
                                style={styles.picker}
                                dropdownIconColor="#fff"
                            >
                                {sectionOptions.map((s) => (
                                    <Picker.Item key={s} label={s || 'Select Sec'} value={s} color={Platform.OS === 'ios' ? '#000' : '#475569'} />
                                ))}
                            </Picker>
                        </View>
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
                        if (sel) setDate(sel);
                    }}
                />
            )}

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
                            {takenByName && <Text style={styles.takenBy}>Taken by: {takenByName}</Text>}

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

                        {loading ? (
                            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366f1" />
                        ) : error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : (
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
                        )}
                    </View>
                )}
            </View>

            {canSubmit && isToday && (!hasSubmitted || isUpdating) && (
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.submitBtn} onPress={submitAttendance}>
                        <Text style={styles.submitBtnText}>Submit Attendance</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: '#6366f1',
        paddingHorizontal: 20,
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
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    filtersContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 15,
    },
    filterGroup: { flex: 1 },
    filterLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 4 },
    pickerWrapper: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        height: 48,
        justifyContent: 'center',
    },
    picker: { color: '#fff' },
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

    listContainer: { paddingBottom: 100 },
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
    emptyText: { marginTop: 15, fontSize: 16, color: '#94a3b8', fontWeight: '600' },
    errorBox: { backgroundColor: '#fef2f2', padding: 15, borderRadius: 12 },
    errorText: { color: '#ef4444', textAlign: 'center' },

    successView: { flex: 1, justifyContent: 'center' },
    successCard: {
        backgroundColor: '#fff',
        padding: 30,
        borderRadius: 32,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    successIconBox: { marginBottom: 20 },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
    successDesc: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
    takenBy: { fontSize: 14, color: '#6366f1', fontWeight: '700', marginBottom: 25 },
    actionButton: {
        backgroundColor: '#eef2ff',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 14,
    },
    actionButtonText: { color: '#6366f1', fontWeight: '700' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(248, 250, 252, 0.95)',
    },
    submitBtn: {
        backgroundColor: '#6366f1',
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#6366f1',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
