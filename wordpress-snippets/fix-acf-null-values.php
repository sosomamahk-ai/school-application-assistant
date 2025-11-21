<?php
/**
 * ACF 字段 null 值自动修复工具
 * 
 * 功能说明：
 * 1. 扫描所有文章、页面和自定义文章类型的 ACF 字段
 * 2. 检测并修复 null 值为适当的默认值（字符串字段为空字符串，数组字段为空数组等）
 * 3. 支持所有 ACF 字段类型（text, textarea, select, relationship, repeater 等）
 * 4. 提供详细的日志和修复报告
 * 
 * 使用方法：
 * 1. 将此代码添加到 WordPress functions.php 或 Code Snippets 插件
 * 2. 在 WordPress 后台访问：网站URL/?fix_acf_null=1
 * 3. 或者使用 WP-CLI：wp eval-file fix-acf-null-values.php
 * 
 * 安全说明：
 * - 运行前会显示预览模式，显示将要修复的内容
 * - 需要添加 ?fix_acf_null=1&confirm=true 才会实际执行修复
 * - 建议先备份数据库
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// 确保错误报告（仅在调试模式下）
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 0); // 不直接显示错误，而是记录到日志
}

class ACF_Null_Value_Fixer {
    
    private $stats = array(
        'posts_scanned' => 0,
        'fields_checked' => 0,
        'null_fields_found' => 0,
        'null_fields_fixed' => 0,
        'errors' => 0,
        'details' => array()
    );
    
    private $dry_run = true; // 默认预览模式，不实际修改
    
    /**
     * 根据字段类型确定 null 值的默认替换值
     */
    private function get_default_value_for_field_type($field_type, $field) {
        switch ($field_type) {
            case 'text':
            case 'textarea':
            case 'wysiwyg':
            case 'email':
            case 'url':
            case 'password':
            case 'message':
                return '';
            
            case 'number':
            case 'range':
                return 0;
            
            case 'true_false':
                return false;
            
            case 'date_picker':
            case 'date_time_picker':
            case 'time_picker':
                return '';
            
            case 'select':
            case 'radio':
            case 'button_group':
                // 检查是否有默认值设置
                if (isset($field['default_value']) && $field['default_value'] !== null) {
                    return $field['default_value'];
                }
                return '';
            
            case 'checkbox':
            case 'relationship':
            case 'post_object':
            case 'user':
            case 'taxonomy':
                return array();
            
            case 'repeater':
                return array();
            
            case 'group':
                return array();
            
            case 'gallery':
            case 'image':
            case 'file':
                return '';
            
            case 'color_picker':
                return '';
            
            case 'google_map':
                return array();
            
            case 'link':
                return array();
            
            default:
                // 对于未知类型，默认返回空字符串
                return '';
        }
    }
    
    /**
     * 递归修复数组中的 null 值
     */
    private function fix_null_in_array($value, $field_group = null) {
        if (is_array($value)) {
            $fixed = array();
            foreach ($value as $key => $item) {
                $fixed[$key] = $this->fix_null_in_array($item, $field_group);
            }
            return $fixed;
        } elseif ($value === null) {
            // 如果是数组上下文中的 null，返回空字符串
            return '';
        }
        return $value;
    }
    
    /**
     * 修复单个字段的 null 值
     */
    private function fix_field_null_value($post_id, $field_name, $field_key, $field_config = null) {
        // 方法1：通过 ACF 函数获取字段值（format_value=false 获取原始值）
        $current_value = get_field($field_name, $post_id, false);
        
        // 方法2：如果方法1返回null，尝试从数据库直接读取
        if ($current_value === null) {
            $current_value = $this->get_field_from_db($post_id, $field_key);
        }
        
        // 获取字段类型和配置
        $field_type = 'text'; // 默认类型
        if ($field_config && isset($field_config['type'])) {
            $field_type = $field_config['type'];
        } elseif (function_exists('acf_get_field')) {
            $field_obj = acf_get_field($field_key);
            if ($field_obj && isset($field_obj['type'])) {
                $field_type = $field_obj['type'];
                $field_config = $field_obj;
            }
        }
        
        // 检查是否为 null（包括空字符串的情况，某些字段可能存储为空字符串而不是null）
        if ($current_value === null || ($current_value === '' && in_array($field_type, array('relationship', 'post_object', 'checkbox', 'taxonomy')))) {
            $this->stats['null_fields_found']++;
            
            // 确定替换值
            $default_value = $this->get_default_value_for_field_type($field_type, $field_config ? $field_config : array());
            
            if (!$this->dry_run) {
                // 方法1：通过 ACF 函数更新
                update_field($field_key, $default_value, $post_id);
                
                // 方法2：直接更新数据库（确保数据一致性）
                $this->update_field_in_db($post_id, $field_key, $default_value);
                
                $this->stats['null_fields_fixed']++;
            }
            
            // 记录详细信息（修复模式下减少记录）
            if ($this->dry_run || count($this->stats['details']) < 100) {
                $this->stats['details'][] = array(
                    'post_id' => $post_id,
                    'post_title' => get_the_title($post_id),
                    'post_type' => get_post_type($post_id),
                    'field_name' => $field_name,
                    'field_key' => $field_key,
                    'field_type' => $field_type,
                    'old_value' => $current_value,
                    'new_value' => $default_value,
                    'status' => $this->dry_run ? 'preview' : 'fixed'
                );
            }
            
            return true;
        } elseif (is_array($current_value)) {
            // 检查数组中是否有 null 值
            $has_null = false;
            $fixed_value = $this->fix_null_in_array($current_value);
            
            // 检查是否有变化
            if ($fixed_value !== $current_value) {
                $has_null = true;
                $this->stats['null_fields_found']++;
                
                if (!$this->dry_run) {
                    update_field($field_key, $fixed_value, $post_id);
                    $this->update_field_in_db($post_id, $field_key, $fixed_value);
                    $this->stats['null_fields_fixed']++;
                }
                
                // 记录详细信息（修复模式下减少记录）
                if ($this->dry_run || count($this->stats['details']) < 100) {
                    $this->stats['details'][] = array(
                        'post_id' => $post_id,
                        'post_title' => get_the_title($post_id),
                        'post_type' => get_post_type($post_id),
                        'field_name' => $field_name,
                        'field_key' => $field_key,
                        'field_type' => $field_type . ' (array)',
                        'old_value' => $current_value,
                        'new_value' => $fixed_value,
                        'status' => $this->dry_run ? 'preview' : 'fixed'
                    );
                }
            }
            
            return $has_null;
        }
        
        return false;
    }
    
    /**
     * 处理 repeater 字段
     */
    private function fix_repeater_field($post_id, $field_name, $field_key, $field_config) {
        // 获取 repeater 行数（使用 format_value=false 获取原始值）
        $rows = get_field($field_name, $post_id, false);
        
        // Repeater 字段返回 null 或 false 表示没有数据，这是正常的
        if ($rows === null || $rows === false || empty($rows)) {
            // 检查数据库中是否真的是 null（而不是空数组）
            $db_value = $this->get_field_from_db($post_id, $field_key);
            if ($db_value === null) {
                // 数据库中确实是 null，需要修复为空数组
                $this->stats['null_fields_found']++;
                
                if (!$this->dry_run) {
                    update_field($field_key, array(), $post_id);
                    $this->update_field_in_db($post_id, $field_key, array());
                    $this->stats['null_fields_fixed']++;
                }
                
                // 记录详细信息（修复模式下减少记录）
                if ($this->dry_run || count($this->stats['details']) < 100) {
                    $this->stats['details'][] = array(
                        'post_id' => $post_id,
                        'post_title' => get_the_title($post_id),
                        'post_type' => get_post_type($post_id),
                        'field_name' => $field_name,
                        'field_key' => $field_key,
                        'field_type' => 'repeater (empty)',
                        'old_value' => null,
                        'new_value' => array(),
                        'status' => $this->dry_run ? 'preview' : 'fixed'
                    );
                }
                
                return true;
            }
            // 如果是空数组，这是正常的，不需要修复
            return false;
        }
        
        if (!is_array($rows)) {
            return false;
        }
        
        // Repeater 字段返回数组是正常的，不需要修复
        // 我们只需要检查子字段中是否有 null 值
        
        $has_fixes = false;
        
        // 遍历每一行
        foreach ($rows as $row_index => $row) {
            if (!isset($field_config['sub_fields'])) {
                continue;
            }
            
            // 遍历子字段
            foreach ($field_config['sub_fields'] as $sub_field) {
                $sub_field_name = $field_name . '_' . $row_index . '_' . $sub_field['name'];
                $sub_field_key = $sub_field['key'];
                
                // 方法1：通过字段名获取（ACF 格式）
                $sub_value = get_field($sub_field_name, $post_id, false);
                
                // 方法2：如果方法1返回null，尝试从数据库直接读取
                if ($sub_value === null) {
                    $sub_value = $this->get_field_from_db($post_id, $sub_field_key);
                }
                
                // 方法3：从 repeater 行数据中获取
                if ($sub_value === null && is_array($row) && isset($row[$sub_field['name']])) {
                    $sub_value = $row[$sub_field['name']];
                }
                
                if ($sub_value === null) {
                    $this->stats['null_fields_found']++;
                    $has_fixes = true;
                    
                    $default_value = $this->get_default_value_for_field_type(
                        $sub_field['type'],
                        $sub_field
                    );
                    
                    if (!$this->dry_run) {
                        // 更新整个 repeater 数据
                        $row_data = get_field($field_name, $post_id);
                        if (!is_array($row_data)) {
                            $row_data = array();
                        }
                        
                        if (!isset($row_data[$row_index])) {
                            $row_data[$row_index] = array();
                        }
                        
                        $row_data[$row_index][$sub_field['name']] = $default_value;
                        
                        // 更新 repeater 字段
                        update_field($field_key, $row_data, $post_id);
                        
                        // 也直接更新子字段的数据库记录
                        $this->update_field_in_db($post_id, $sub_field_key, $default_value);
                        
                        $this->stats['null_fields_fixed']++;
                    }
                    
                    // 记录详细信息（修复模式下减少记录）
                    if ($this->dry_run || count($this->stats['details']) < 100) {
                        $this->stats['details'][] = array(
                            'post_id' => $post_id,
                            'post_title' => get_the_title($post_id),
                            'post_type' => get_post_type($post_id),
                            'field_name' => $sub_field_name,
                            'field_key' => $sub_field_key,
                            'field_type' => $sub_field['type'] . ' (repeater sub-field)',
                            'old_value' => null,
                            'new_value' => $default_value,
                            'status' => $this->dry_run ? 'preview' : 'fixed'
                        );
                    }
                } elseif (is_array($sub_value)) {
                    $fixed_sub_value = $this->fix_null_in_array($sub_value);
                    if ($fixed_sub_value !== $sub_value) {
                        $has_fixes = true;
                        $this->stats['null_fields_found']++;
                        
                        if (!$this->dry_run) {
                            $row_data = get_field($field_name, $post_id);
                            if (is_array($row_data) && isset($row_data[$row_index])) {
                                $row_data[$row_index][$sub_field['name']] = $fixed_sub_value;
                                update_field($field_key, $row_data, $post_id);
                                $this->update_field_in_db($post_id, $sub_field_key, $fixed_sub_value);
                            }
                            $this->stats['null_fields_fixed']++;
                        }
                        
                        // 记录详细信息（修复模式下减少记录）
                        if ($this->dry_run || count($this->stats['details']) < 100) {
                            $this->stats['details'][] = array(
                                'post_id' => $post_id,
                                'post_title' => get_the_title($post_id),
                                'post_type' => get_post_type($post_id),
                                'field_name' => $sub_field_name,
                                'field_key' => $sub_field_key,
                                'field_type' => $sub_field['type'] . ' (repeater sub-field)',
                                'old_value' => $sub_value,
                                'new_value' => $fixed_sub_value,
                                'status' => $this->dry_run ? 'preview' : 'fixed'
                            );
                        }
                    }
                }
            }
        }
        
        return $has_fixes;
    }
    
    /**
     * 从数据库直接获取字段值（绕过 ACF 格式化）
     */
    private function get_field_from_db($post_id, $field_key) {
        global $wpdb;
        
        $value = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_value FROM {$wpdb->postmeta} 
             WHERE post_id = %d AND meta_key = %s LIMIT 1",
            $post_id,
            $field_key
        ));
        
        if ($value === null) {
            return null;
        }
        
        // 尝试反序列化
        $unserialized = maybe_unserialize($value);
        return $unserialized !== false ? $unserialized : $value;
    }
    
    /**
     * 直接更新数据库中的字段值
     */
    private function update_field_in_db($post_id, $field_key, $value) {
        global $wpdb;
        
        // 序列化值（如果需要）
        $serialized_value = maybe_serialize($value);
        
        // 检查记录是否存在
        $exists = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_id FROM {$wpdb->postmeta} 
             WHERE post_id = %d AND meta_key = %s LIMIT 1",
            $post_id,
            $field_key
        ));
        
        if ($exists) {
            // 更新现有记录
            $wpdb->update(
                $wpdb->postmeta,
                array('meta_value' => $serialized_value),
                array('post_id' => $post_id, 'meta_key' => $field_key),
                array('%s'),
                array('%d', '%s')
            );
        } else {
            // 插入新记录
            $wpdb->insert(
                $wpdb->postmeta,
                array(
                    'post_id' => $post_id,
                    'meta_key' => $field_key,
                    'meta_value' => $serialized_value
                ),
                array('%d', '%s', '%s')
            );
        }
        
        // 清理缓存
        wp_cache_delete($post_id, 'post_meta');
    }
    
    /**
     * 处理 group 字段
     */
    private function fix_group_field($post_id, $field_name, $field_key, $field_config) {
        if (!isset($field_config['sub_fields'])) {
            return false;
        }
        
        $has_fixes = false;
        
        foreach ($field_config['sub_fields'] as $sub_field) {
            $sub_field_name = $field_name . '_' . $sub_field['name'];
            $sub_field_key = $sub_field['key'];
            
            $sub_value = get_field($sub_field_name, $post_id, false);
            
            if ($sub_value === null) {
                $this->stats['null_fields_found']++;
                $has_fixes = true;
                
                $default_value = $this->get_default_value_for_field_type(
                    $sub_field['type'],
                    $sub_field
                );
                
                if (!$this->dry_run) {
                    update_field($sub_field_key, $default_value, $post_id);
                    $this->stats['null_fields_fixed']++;
                }
                
                // 记录详细信息（修复模式下减少记录）
                if ($this->dry_run || count($this->stats['details']) < 100) {
                    $this->stats['details'][] = array(
                        'post_id' => $post_id,
                        'post_title' => get_the_title($post_id),
                        'post_type' => get_post_type($post_id),
                        'field_name' => $sub_field_name,
                        'field_key' => $sub_field_key,
                        'field_type' => $sub_field['type'] . ' (group sub-field)',
                        'old_value' => null,
                        'new_value' => $default_value,
                        'status' => $this->dry_run ? 'preview' : 'fixed'
                    );
                }
            } elseif (is_array($sub_value)) {
                $fixed_sub_value = $this->fix_null_in_array($sub_value);
                if ($fixed_sub_value !== $sub_value) {
                    $has_fixes = true;
                    $this->stats['null_fields_found']++;
                    
                    if (!$this->dry_run) {
                        update_field($sub_field_key, $fixed_sub_value, $post_id);
                        $this->stats['null_fields_fixed']++;
                    }
                    
                    // 记录详细信息（修复模式下减少记录）
                    if ($this->dry_run || count($this->stats['details']) < 100) {
                        $this->stats['details'][] = array(
                            'post_id' => $post_id,
                            'post_title' => get_the_title($post_id),
                            'post_type' => get_post_type($post_id),
                            'field_name' => $sub_field_name,
                            'field_key' => $sub_field_key,
                            'field_type' => $sub_field['type'] . ' (group sub-field)',
                            'old_value' => $sub_value,
                            'new_value' => $fixed_sub_value,
                            'status' => $this->dry_run ? 'preview' : 'fixed'
                        );
                    }
                }
            }
        }
        
        return $has_fixes;
    }
    
    /**
     * 处理单个文章的所有 ACF 字段
     */
    private function fix_post_fields($post_id) {
        $this->stats['posts_scanned']++;
        
        // 检查函数是否存在
        if (!function_exists('acf_get_field_groups') || !function_exists('acf_get_fields')) {
            return;
        }
        
        try {
            // 获取文章的所有 ACF 字段组
            $field_groups = acf_get_field_groups(array('post_id' => $post_id));
            
            // 如果为空，也尝试获取所有字段组
            if (empty($field_groups)) {
                $field_groups = acf_get_field_groups();
            }
            
            if (empty($field_groups) || !is_array($field_groups)) {
                return;
            }
            
            foreach ($field_groups as $field_group) {
                if (!isset($field_group['key']) && !isset($field_group['ID'])) {
                    continue;
                }
                
                $fields = acf_get_fields($field_group);
                
                if (empty($fields) || !is_array($fields)) {
                    continue;
                }
                
                foreach ($fields as $field) {
                    if (!isset($field['name']) || !isset($field['key'])) {
                        continue;
                    }
                    
                    $this->stats['fields_checked']++;
                    
                    $field_name = $field['name'];
                    $field_key = $field['key'];
                    $field_type = isset($field['type']) ? $field['type'] : 'text';
                    
                    // 根据字段类型处理
                    try {
                        if ($field_type === 'repeater') {
                            $this->fix_repeater_field($post_id, $field_name, $field_key, $field);
                        } elseif ($field_type === 'group') {
                            $this->fix_group_field($post_id, $field_name, $field_key, $field);
                        } else {
                            $this->fix_field_null_value($post_id, $field_name, $field_key, $field);
                        }
                    } catch (Exception $e) {
                        $this->stats['errors']++;
                        error_log('ACF Null Fixer Error processing field ' . $field_name . ' for Post ID ' . $post_id . ': ' . $e->getMessage());
                    }
                }
            }
        } catch (Exception $e) {
            $this->stats['errors']++;
            error_log('ACF Null Fixer Error for Post ID ' . $post_id . ': ' . $e->getMessage());
        }
    }
    
    /**
     * 执行修复扫描（优化版本，限制处理数量）
     */
    public function run($dry_run = true, $limit = 1000, $offset = 0) {
        // 增加执行时间限制
        @set_time_limit(300); // 5分钟
        @ini_set('max_execution_time', 300);
        
        // 修复模式下减少批量大小，避免超时
        if (!$dry_run) {
            $batch_size = 10; // 每次只修复10篇文章
        } else {
            $batch_size = $limit; // 扫描模式可以处理更多
        }
        
        $this->dry_run = $dry_run;
        $this->stats = array(
            'posts_scanned' => 0,
            'fields_checked' => 0,
            'null_fields_found' => 0,
            'null_fields_fixed' => 0,
            'errors' => 0,
            'details' => array()
        );
        
        // 检查 ACF 是否安装
        if (!function_exists('get_field')) {
            $this->stats['errors']++;
            return array(
                'success' => false,
                'message' => 'ACF 插件未安装或未激活',
                'stats' => $this->stats
            );
        }
        
        // 检查 acf_get_field_groups 函数是否存在（ACF Pro）
        if (!function_exists('acf_get_field_groups')) {
            $this->stats['errors']++;
            return array(
                'success' => false,
                'message' => 'ACF 函数不可用。请确保已安装 Advanced Custom Fields 插件（Pro 版本）或使用兼容的方法。',
                'stats' => $this->stats
            );
        }
        
        // 获取所有文章类型（包括自定义文章类型）
        $post_types = get_post_types(array('public' => true), 'names');
        
        // 添加私有文章类型
        $private_post_types = get_post_types(array('public' => false, '_builtin' => false), 'names');
        $post_types = array_merge($post_types, $private_post_types);
        
        // 如果没有文章类型，返回错误
        if (empty($post_types)) {
            $this->stats['errors']++;
            return array(
                'success' => false,
                'message' => '未找到任何文章类型',
                'stats' => $this->stats
            );
        }
        
        // 查询文章（限制数量，避免超时）
        $args = array(
            'post_type' => $post_types,
            'post_status' => 'any',
            'posts_per_page' => $batch_size,
            'offset' => $offset,
            'fields' => 'ids',
            'orderby' => 'ID',
            'order' => 'DESC' // 从最新的开始
        );
        
        $query = new WP_Query($args);
        $total_found = $query->found_posts;
        $processed_count = 0;
        
        if ($query->have_posts() && !empty($query->posts)) {
            foreach ($query->posts as $post_id) {
                try {
                    $this->fix_post_fields($post_id);
                    $processed_count++;
                    
                    // 修复模式下不记录详细信息，避免内存溢出和超时
                    if (!$dry_run && count($this->stats['details']) > 100) {
                        // 修复模式下只保留最新的100条
                        $this->stats['details'] = array_slice($this->stats['details'], -100);
                    } elseif ($dry_run && count($this->stats['details']) > 500) {
                        // 扫描模式保留500条
                        $this->stats['details'] = array_slice($this->stats['details'], -500);
                    }
                    
                    // 修复模式下每处理5个文章就刷新一次输出
                    $refresh_interval = $dry_run ? 50 : 5;
                    if ($processed_count % $refresh_interval == 0) {
                        if (ob_get_level() > 0) {
                            ob_flush();
                        }
                        flush();
                    }
                    
                } catch (Exception $e) {
                    $this->stats['errors']++;
                    error_log('ACF Null Fixer Error for Post ID ' . $post_id . ': ' . $e->getMessage());
                } catch (Error $e) {
                    $this->stats['errors']++;
                    error_log('ACF Null Fixer Fatal Error for Post ID ' . $post_id . ': ' . $e->getMessage());
                }
            }
        }
        
        wp_reset_postdata();
        
        return array(
            'success' => true,
            'message' => $dry_run ? '预览扫描完成' : '修复完成',
            'stats' => $this->stats,
            'summary' => array(
                'processed' => $processed_count,
                'total_found' => $total_found,
                'offset' => $offset,
                'batch_size' => $batch_size,
                'has_more' => ($offset + $processed_count) < $total_found,
                'next_offset' => $offset + $processed_count,
                'limit_reached' => $processed_count >= $limit && $total_found > $limit
            )
        );
    }
    
    /**
     * 生成报告
     */
    public function generate_report($result) {
        $stats = $result['stats'];
        
        $html = '<div style="font-family: monospace; max-width: 1200px; margin: 20px auto; padding: 20px; background: #f5f5f5;">';
        $html .= '<h1 style="color: #333;">ACF 字段 null 值修复工具</h1>';
        
        if (!$result['success']) {
            $html .= '<div style="background: #ffcccc; padding: 15px; border-radius: 5px; margin: 20px 0;">';
            $html .= '<strong>错误：</strong> ' . esc_html($result['message']);
            $html .= '</div>';
            $html .= '</div>';
            return $html;
        }
        
        $html .= '<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">';
        $html .= '<h2 style="color: #4682B4;">统计信息</h2>';
        $html .= '<table style="width: 100%; border-collapse: collapse;">';
        $html .= '<tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>扫描的文章数</strong></td><td style="padding: 10px; border: 1px solid #ddd;">' . $stats['posts_scanned'] . '</td></tr>';
        $html .= '<tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>检查的字段数</strong></td><td style="padding: 10px; border: 1px solid #ddd;">' . $stats['fields_checked'] . '</td></tr>';
        $html .= '<tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>发现的 null 字段数</strong></td><td style="padding: 10px; border: 1px solid #ddd;"><span style="color: ' . ($stats['null_fields_found'] > 0 ? '#ff6600' : '#00aa00') . ';">' . $stats['null_fields_found'] . '</span></td></tr>';
        $html .= '<tr><td style="padding: 10px; border: 1px solid #ddd;"><strong>已修复的字段数</strong></td><td style="padding: 10px; border: 1px solid #ddd;"><span style="color: ' . ($stats['null_fields_fixed'] > 0 ? '#00aa00' : '#666') . ';">' . $stats['null_fields_fixed'] . '</span></td></tr>';
        $html .= '<tr style="background: #f0f0f0;"><td style="padding: 10px; border: 1px solid #ddd;"><strong>错误数</strong></td><td style="padding: 10px; border: 1px solid #ddd;">' . $stats['errors'] . '</td></tr>';
        $html .= '</table>';
        $html .= '</div>';
        
        if (!empty($stats['details'])) {
            $html .= '<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">';
            $html .= '<h2 style="color: #4682B4;">详细信息</h2>';
            $html .= '<div style="max-height: 600px; overflow-y: auto;">';
            $html .= '<table style="width: 100%; border-collapse: collapse; font-size: 12px;">';
            $html .= '<thead><tr style="background: #4682B4; color: white;">';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">文章ID</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">文章标题</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">文章类型</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">字段名</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">字段类型</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">旧值</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">新值</th>';
            $html .= '<th style="padding: 8px; border: 1px solid #ddd; text-align: left;">状态</th>';
            $html .= '</tr></thead><tbody>';
            
            foreach ($stats['details'] as $detail) {
                $row_color = $detail['status'] === 'fixed' ? '#e8f5e9' : '#fff3e0';
                $html .= '<tr style="background: ' . $row_color . ';">';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;">' . $detail['post_id'] . '</td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;">' . esc_html($detail['post_title']) . '</td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;">' . esc_html($detail['post_type']) . '</td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;"><code>' . esc_html($detail['field_name']) . '</code></td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;">' . esc_html($detail['field_type']) . '</td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;"><code>' . (is_null($detail['old_value']) ? 'null' : (is_array($detail['old_value']) ? 'array(' . count($detail['old_value']) . ')' : esc_html(strval($detail['old_value'])))) . '</code></td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;"><code>' . (is_array($detail['new_value']) ? 'array(' . count($detail['new_value']) . ')' : esc_html(strval($detail['new_value']))) . '</code></td>';
                $html .= '<td style="padding: 8px; border: 1px solid #ddd;"><strong>' . ($detail['status'] === 'fixed' ? '已修复' : '预览') . '</strong></td>';
                $html .= '</tr>';
            }
            
            $html .= '</tbody></table>';
            $html .= '</div>';
            $html .= '</div>';
        }
        
        $html .= '</div>';
        
        return $html;
    }
}

// 如果通过 URL 参数访问，执行修复
if (isset($_GET['fix_acf_null'])) {
    // 检查权限（仅管理员）
    if (!current_user_can('manage_options')) {
        wp_die('您没有权限执行此操作');
    }
    
    $confirm = isset($_GET['confirm']) && $_GET['confirm'] === 'true';
    $dry_run = !$confirm;
    
    $fixer = new ACF_Null_Value_Fixer();
    $result = $fixer->run($dry_run);
    
    // 输出报告
    echo $fixer->generate_report($result);
    
    if ($dry_run && $result['success'] && $result['stats']['null_fields_found'] > 0) {
        echo '<div style="max-width: 1200px; margin: 20px auto; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px;">';
        echo '<h3 style="color: #856404;">预览模式</h3>';
        echo '<p>这是预览模式，未进行实际修复。如果确认要执行修复，请点击下面的链接：</p>';
        echo '<p><a href="?fix_acf_null=1&confirm=true" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">确认执行修复</a></p>';
        echo '<p style="color: #856404;"><strong>警告：</strong>请确保在执行修复前已备份数据库！</p>';
        echo '</div>';
    }
    
    exit;
}

// 添加管理菜单（可选）
add_action('admin_menu', function() {
    if (current_user_can('manage_options')) {
        add_management_page(
            'ACF null 值修复',
            'ACF null 值修复',
            'manage_options',
            'fix-acf-null',
            'acf_null_fixer_admin_page'
        );
    }
});

// AJAX处理批量修复
add_action('wp_ajax_acf_fix_batch', 'acf_fix_batch_ajax_handler');
function acf_fix_batch_ajax_handler() {
    // 检查权限
    if (!current_user_can('manage_options')) {
        wp_send_json_error(array('message' => '您没有权限执行此操作'));
        return;
    }
    
    check_ajax_referer('acf_fix_batch', 'nonce');
    
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
    $dry_run = isset($_POST['dry_run']) ? ($_POST['dry_run'] === 'true') : false;
    
    try {
        $fixer = new ACF_Null_Value_Fixer();
        $result = $fixer->run($dry_run, 1000, $offset);
        
        wp_send_json_success($result);
    } catch (Exception $e) {
        wp_send_json_error(array('message' => $e->getMessage()));
    }
}

// 管理页面回调函数（安全版本：先显示页面，用户点击按钮才开始扫描）
function acf_null_fixer_admin_page() {
    // 首先输出HTML头部，确保页面能加载
    echo '<div class="wrap">';
    echo '<h1>ACF 字段 null 值修复工具</h1>';
    
    // 检查权限
    if (!current_user_can('manage_options')) {
        echo '<div class="notice notice-error"><p><strong>错误：</strong>您没有权限访问此页面。</p></div>';
        echo '</div>';
        return;
    }
    
    // 检查 ACF 是否安装
    if (!function_exists('get_field') && !function_exists('acf_get_field_groups')) {
        echo '<div class="notice notice-error"><p><strong>错误：</strong>ACF 插件未安装或未激活。请先安装并激活 Advanced Custom Fields 插件。</p></div>';
        echo '</div>';
        return;
    }
    
    // 检查类是否存在（代码是否加载）
    if (!class_exists('ACF_Null_Value_Fixer')) {
        echo '<div class="notice notice-error"><p><strong>错误：</strong>ACF_Null_Value_Fixer 类未找到。请确保代码片段已正确加载。</p></div>';
        echo '</div>';
        return;
    }
    
    // 检查是否有 "run" 参数（用户点击了开始按钮）
    $run_scan = isset($_GET['run']) && $_GET['run'] === '1';
    $confirm = isset($_GET['confirm']) && $_GET['confirm'] === 'true';
    $dry_run = !$confirm;
    
    // 如果用户没有点击开始按钮，显示开始界面
    if (!$run_scan) {
        echo '<div class="notice notice-info"><p>使用此工具可以扫描并修复 ACF 字段中的 null 值。建议先预览模式扫描，确认要修复的字段后再执行修复。</p></div>';
        
        echo '<div style="background: white; padding: 20px; border: 1px solid #ccc; border-radius: 5px; margin: 20px 0;">';
        echo '<h2>使用说明</h2>';
        echo '<ol>';
        echo '<li><strong>预览模式</strong>：扫描并显示需要修复的字段，不会实际修改数据</li>';
        echo '<li><strong>修复模式</strong>：实际修复 null 值为适当的默认值</li>';
        echo '<li>工具将扫描最近 <strong>1000</strong> 篇文章，避免超时</li>';
        echo '<li>如需扫描全部文章，请多次运行</li>';
        echo '</ol>';
        echo '</div>';
        
        echo '<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">';
        echo '<h3>开始扫描</h3>';
        echo '<p>点击下面的按钮开始扫描。扫描过程可能需要几分钟时间，请耐心等待。</p>';
        echo '<p>';
        echo '<a href="' . admin_url('admin.php?page=fix-acf-null&run=1') . '" class="button button-primary button-large">开始预览扫描</a>';
        echo ' <span style="margin: 0 10px;">或</span> ';
        echo '<a href="' . admin_url('admin.php?page=fix-acf-null&run=1&confirm=true') . '" class="button button-secondary button-large">直接执行修复</a>';
        echo '</p>';
        echo '<p><strong>警告：</strong>执行修复前请务必备份数据库！</p>';
        echo '</div>';
        
        echo '</div>';
        return;
    }
    
    // 修复模式：使用AJAX分批处理
    if (!$dry_run) {
        // 输出批量处理界面
        echo '<div id="batch-processing-container" style="background: white; padding: 20px; border: 1px solid #ccc; border-radius: 5px; margin: 20px 0;">';
        echo '<h2>批量修复进度</h2>';
        echo '<div id="batch-progress" style="margin: 20px 0;">';
        echo '<div style="background: #f0f0f0; border-radius: 4px; height: 30px; position: relative; overflow: hidden;">';
        echo '<div id="progress-bar" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;"></div>';
        echo '</div>';
        echo '<p id="progress-text" style="margin-top: 10px;">准备开始...</p>';
        echo '</div>';
        echo '<div id="batch-stats" style="display: none; margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">';
        echo '<h3>累计统计</h3>';
        echo '<table style="width: 100%;">';
        echo '<tr><td>已扫描文章数：</td><td id="total-posts-scanned">0</td></tr>';
        echo '<tr><td>已修复字段数：</td><td id="total-fields-fixed">0</td></tr>';
        echo '<tr><td>错误数：</td><td id="total-errors">0</td></tr>';
        echo '</table>';
        echo '</div>';
        echo '<div id="batch-actions" style="margin: 20px 0;">';
        echo '<button id="start-batch" class="button button-primary">开始批量修复</button>';
        echo '<button id="pause-batch" class="button" style="display: none;">暂停</button>';
        echo '<button id="stop-batch" class="button" style="display: none;">停止</button>';
        echo '</div>';
        echo '</div>';
        
        // 输出JavaScript处理批量修复
        $nonce = wp_create_nonce('acf_fix_batch');
        echo '<script>
        jQuery(document).ready(function($) {
            var batchOffset = 0;
            var batchStats = {
                posts_scanned: 0,
                fields_fixed: 0,
                errors: 0,
                total_found: 0
            };
            var isRunning = false;
            var isPaused = false;
            
            $("#start-batch").on("click", function() {
                $(this).hide();
                $("#pause-batch, #stop-batch").show();
                $("#batch-stats").show();
                isRunning = true;
                isPaused = false;
                processBatch();
            });
            
            $("#pause-batch").on("click", function() {
                isPaused = true;
                $(this).text("已暂停");
                $(this).prop("disabled", true);
            });
            
            $("#stop-batch").on("click", function() {
                isRunning = false;
                isPaused = false;
                $("#start-batch").show();
                $("#pause-batch, #stop-batch").hide();
                $("#progress-text").html("已停止");
            });
            
            function processBatch() {
                if (!isRunning || isPaused) return;
                
                $.ajax({
                    url: ajaxurl,
                    type: "POST",
                    data: {
                        action: "acf_fix_batch",
                        nonce: "' . esc_js($nonce) . '",
                        offset: batchOffset,
                        dry_run: "false"
                    },
                    success: function(response) {
                        if (response.success && response.data) {
                            var data = response.data;
                            var stats = data.stats || {};
                            var summary = data.summary || {};
                            
                            // 更新累计统计
                            batchStats.posts_scanned += stats.posts_scanned || 0;
                            batchStats.fields_fixed += stats.null_fields_fixed || 0;
                            batchStats.errors += stats.errors || 0;
                            if (summary.total_found) {
                                batchStats.total_found = summary.total_found;
                            }
                            
                            // 更新显示
                            $("#total-posts-scanned").text(batchStats.posts_scanned);
                            $("#total-fields-fixed").text(batchStats.fields_fixed);
                            $("#total-errors").text(batchStats.errors);
                            
                            // 更新进度条
                            var processed = summary.next_offset || batchOffset + (summary.processed || 0);
                            var progress = batchStats.total_found > 0 ? 
                                Math.min(100, (processed / batchStats.total_found) * 100) : 0;
                            $("#progress-bar").css("width", progress + "%");
                            $("#progress-text").html("已处理 " + processed + " / " + batchStats.total_found + " 篇文章，修复了 " + batchStats.fields_fixed + " 个字段");
                            
                            // 检查是否还有更多
                            if (summary.has_more && isRunning) {
                                batchOffset = summary.next_offset || (batchOffset + (summary.processed || 0));
                                setTimeout(processBatch, 500); // 延迟500ms继续下一批
                            } else {
                                // 完成
                                isRunning = false;
                                $("#progress-bar").css("width", "100%");
                                $("#progress-text").html("<strong>修复完成！</strong>共处理 " + batchStats.posts_scanned + " 篇文章，修复了 " + batchStats.fields_fixed + " 个字段");
                                $("#start-batch").show().text("重新开始");
                                $("#pause-batch, #stop-batch").hide();
                                $("#batch-actions").append("<p style=\"color: #28a745;\"><strong>批量修复已完成！</strong></p>");
                            }
                        } else {
                            // 错误
                            $("#progress-text").html("<span style=\"color: red;\">错误: " + (response.data && response.data.message ? response.data.message : "未知错误") + "</span>");
                            isRunning = false;
                            $("#start-batch").show();
                            $("#pause-batch, #stop-batch").hide();
                        }
                    },
                    error: function(xhr, status, error) {
                        $("#progress-text").html("<span style=\"color: red;\">请求失败: " + error + "</span>");
                        isRunning = false;
                        $("#start-batch").show();
                        $("#pause-batch, #stop-batch").hide();
                    }
                });
            }
        });
        </script>';
        
        echo '</div>';
        return;
    }
    
    // 预览模式：直接执行（一次性扫描更多）
    echo '<div class="notice notice-info"><p>当前为<strong>预览模式</strong>，正在扫描...</p></div>';
    
    // 立即刷新输出，让用户看到提示
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
    
    try {
        // 增加执行时间限制
        @set_time_limit(300); // 5分钟
        @ini_set('max_execution_time', 300);
        
        // 限制处理数量，避免超时
        $limit = 500; // 扫描模式可以处理500篇
        
        // 实例化修复工具
        $fixer = new ACF_Null_Value_Fixer();
        
        // 执行扫描
        $result = $fixer->run($dry_run, $limit);
        
        // 清除"正在扫描"提示
        echo '<script>if(document.querySelector(".notice-info")) document.querySelector(".notice-info").style.display = "none";</script>';
        
        // 显示结果
        if ($result && isset($result['success'])) {
            // 如果有摘要信息，显示处理限制提示
            if (isset($result['summary']) && isset($result['summary']['limit_reached']) && $result['summary']['limit_reached']) {
                echo '<div class="notice notice-info">';
                echo '<p><strong>提示：</strong>本次扫描处理了 ' . intval($result['summary']['processed']) . ' 篇文章（共 ' . intval($result['summary']['total_found']) . ' 篇）。如需扫描全部文章，请多次运行此工具。</p>';
                echo '</div>';
            }
            
            echo $fixer->generate_report($result);
            
            if ($dry_run && $result['success'] && isset($result['stats']['null_fields_found']) && $result['stats']['null_fields_found'] > 0) {
                echo '<div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">';
                echo '<h3>预览模式</h3>';
                echo '<p>这是预览模式，未进行实际修复。如果确认要执行修复，请点击下面的按钮：</p>';
                echo '<p><a href="' . admin_url('admin.php?page=fix-acf-null&run=1&confirm=true') . '" class="button button-primary button-large">确认执行批量修复</a></p>';
                echo '<p><strong>警告：</strong>修复将使用批量处理模式，每次处理10篇文章，自动分批完成。请确保在执行修复前已备份数据库！</p>';
                echo '</div>';
            } elseif ($dry_run && $result['success'] && (!isset($result['stats']['null_fields_found']) || $result['stats']['null_fields_found'] == 0)) {
                echo '<div style="background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">';
                echo '<p><strong>扫描完成！</strong>在扫描的文章中没有发现需要修复的 null 字段。</p>';
                if (isset($result['summary']) && isset($result['summary']['limit_reached']) && $result['summary']['limit_reached']) {
                    echo '<p>注意：只扫描了部分文章。如果需要扫描全部文章，请多次运行此工具。</p>';
                }
                echo '<p><a href="' . admin_url('admin.php?page=fix-acf-null') . '" class="button">返回</a></p>';
                echo '</div>';
            }
        } else {
            echo '<div class="notice notice-error"><p><strong>错误：</strong>执行过程中发生错误。请查看调试日志。</p></div>';
            if (defined('WP_DEBUG') && WP_DEBUG && isset($result)) {
                echo '<p>调试信息：</p>';
                echo '<pre style="background: #f5f5f5; padding: 10px; overflow: auto;">' . esc_html(print_r($result, true)) . '</pre>';
            }
        }
        
    } catch (Exception $e) {
        echo '<div class="notice notice-error"><p><strong>错误：</strong>' . esc_html($e->getMessage()) . '</p></div>';
        if (defined('WP_DEBUG') && WP_DEBUG) {
            echo '<pre style="background: #f5f5f5; padding: 10px; overflow: auto;">' . esc_html($e->getTraceAsString()) . '</pre>';
        }
    } catch (Error $e) {
        echo '<div class="notice notice-error"><p><strong>致命错误：</strong>' . esc_html($e->getMessage()) . '</p></div>';
        if (defined('WP_DEBUG') && WP_DEBUG) {
            echo '<pre style="background: #f5f5f5; padding: 10px; overflow: auto;">' . esc_html($e->getTraceAsString()) . '</pre>';
        }
    }
    
    echo '<p><a href="' . admin_url('admin.php?page=fix-acf-null') . '" class="button">返回首页</a></p>';
    echo '</div>';
}

